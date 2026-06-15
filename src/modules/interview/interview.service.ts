import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { InterviewSession } from './entities/interview-session.entity';
import { InterviewQuestion } from './entities/interview-question.entity';
import { InterviewResponse } from './entities/interview-response.entity';
import { VoiceProfile } from '../voice-profile/entities/voice-profile.entity';
import { StartInterviewDto, SubmitAnswerDto, CompleteInterviewDto } from './dto/interview.dto';
import { InterviewSessionStatus, VoiceProfileStatus, ExtractionStatus } from '../../shared/enums';
import { QUEUE_NAMES } from '../../common/constants';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    @InjectRepository(InterviewSession)
    private sessionRepo: Repository<InterviewSession>,

    @InjectRepository(InterviewQuestion)
    private questionRepo: Repository<InterviewQuestion>,

    @InjectRepository(InterviewResponse)
    private responseRepo: Repository<InterviewResponse>,

    @InjectRepository(VoiceProfile)
    private voiceProfileRepo: Repository<VoiceProfile>,

    @InjectQueue(QUEUE_NAMES.EXTRACTION)
    private extractionQueue: Queue,

    @InjectQueue(QUEUE_NAMES.SYNTHESIS)
    private synthesisQueue: Queue,
  ) {}

  async startInterview(userId: string, dto: StartInterviewDto) {
    // Get total question count
    const totalQuestions = await this.questionRepo.count({ where: { isActive: true } });
    if (totalQuestions === 0) {
      throw new BadRequestException(
        'No interview questions have been seeded yet. Run the seed script first.',
      );
    }

    // Create voice profile (interview_in_progress)
    const voiceProfile = this.voiceProfileRepo.create({
      userId,
      name: dto.voiceProfileName,
      description: dto.description,
      status: VoiceProfileStatus.INTERVIEW_IN_PROGRESS,
    });
    await this.voiceProfileRepo.save(voiceProfile);

    // Create session
    const session = this.sessionRepo.create({
      userId,
      voiceProfileId: voiceProfile.id,
      status: InterviewSessionStatus.ACTIVE,
      currentQuestionIndex: 0,
    });
    await this.sessionRepo.save(session);

    // Fetch first question
    const firstQuestion = await this.questionRepo.findOne({
      where: { orderIndex: 0, isActive: true },
    });

    return {
      sessionId: session.id,
      voiceProfileId: voiceProfile.id,
      totalQuestions,
      firstQuestion: firstQuestion
        ? {
            id: firstQuestion.id,
            orderIndex: firstQuestion.orderIndex,
            category: firstQuestion.category,
            questionText: firstQuestion.questionText,
          }
        : null,
    };
  }

  async getNextQuestion(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Interview session not found');
    if (session.status !== InterviewSessionStatus.ACTIVE) {
      throw new BadRequestException('This interview session is no longer active');
    }

    const totalQuestions = await this.questionRepo.count({ where: { isActive: true } });
    const index = session.currentQuestionIndex;

    if (index >= totalQuestions) {
      return { question: null, index, total: totalQuestions, isLast: true, isComplete: true };
    }

    const question = await this.questionRepo.findOne({
      where: { orderIndex: index, isActive: true },
    });

    return {
      question: question
        ? {
            id: question.id,
            orderIndex: question.orderIndex,
            category: question.category,
            questionText: question.questionText,
          }
        : null,
      index,
      total: totalQuestions,
      isLast: index === totalQuestions - 1,
      isComplete: false,
    };
  }

  async submitAnswer(userId: string, dto: SubmitAnswerDto) {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId, userId },
    });
    if (!session) throw new NotFoundException('Interview session not found');
    if (session.status !== InterviewSessionStatus.ACTIVE) {
      throw new BadRequestException('This interview session is no longer active');
    }

    const question = await this.questionRepo.findOne({
      where: { id: dto.questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    // Save the response
    const response = this.responseRepo.create({
      sessionId: dto.sessionId,
      questionId: dto.questionId,
      rawAnswer: dto.rawAnswer,
      extractionStatus: ExtractionStatus.PENDING,
    });
    await this.responseRepo.save(response);

    // Dispatch extraction job
    await this.extractionQueue.add(
      'extract-voice-attributes',
      { responseId: response.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    // Advance the session index
    const totalQuestions = await this.questionRepo.count({ where: { isActive: true } });
    const nextIndex = session.currentQuestionIndex + 1;
    await this.sessionRepo.update(session.id, {
      currentQuestionIndex: nextIndex,
    });

    return {
      success: true,
      responseId: response.id,
      nextQuestionAvailable: nextIndex < totalQuestions,
      isInterviewComplete: nextIndex >= totalQuestions,
    };
  }

  async completeInterview(userId: string, dto: CompleteInterviewDto) {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId, userId },
    });
    if (!session) throw new NotFoundException('Interview session not found');
    if (session.status !== InterviewSessionStatus.ACTIVE) {
      throw new BadRequestException('Interview already completed or abandoned');
    }

    // Mark session complete
    await this.sessionRepo.update(session.id, {
      status: InterviewSessionStatus.COMPLETED,
      completedAt: new Date(),
    });

    // Update voice profile to processing
    await this.voiceProfileRepo.update(session.voiceProfileId, {
      status: VoiceProfileStatus.PROCESSING,
    });

    // Dispatch synthesis job — will wait for all extraction jobs to finish
    await this.synthesisQueue.add(
      'synthesize-voice-profile',
      { voiceProfileId: session.voiceProfileId, sessionId: session.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Interview completed for session ${session.id}. Synthesis job queued.`);

    return {
      success: true,
      voiceProfileId: session.voiceProfileId,
      status: 'processing',
      message: 'Your voice profile is being synthesised. You will receive an email when it is ready.',
    };
  }
}
