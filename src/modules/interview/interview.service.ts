import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { InterviewSession } from './entities/interview-session.entity';
import { InterviewQuestion } from './entities/interview-question.entity';
import { InterviewResponse } from './entities/interview-response.entity';
import { VoiceProfile } from '../voice-profile/entities/voice-profile.entity';
import { StartInterviewDto, SubmitAnswerDto, CompleteInterviewDto } from './dto/interview.dto';
import { QUEUE_NAMES } from '../../common/constants';
import { InterviewSessionStatus, VoiceProfileStatus } from '../../shared/enums';

@Injectable()
export class InterviewService {
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
  ) {}

  async startInterview(userId: string, dto: StartInterviewDto) {
    const profile = this.voiceProfileRepo.create({
      userId,
      name: dto.title,
      status: VoiceProfileStatus.INTERVIEW_PENDING,
    });
    await this.voiceProfileRepo.save(profile);

    const session = this.sessionRepo.create({
      userId,
      voiceProfileId: profile.id,
      status: InterviewSessionStatus.IN_PROGRESS,
    });
    await this.sessionRepo.save(session);

    return { sessionId: session.id, voiceProfileId: profile.id };
  }

  async getNextQuestion(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();

    const responses = await this.responseRepo.find({ where: { sessionId } });
    const answeredQuestionIds = responses.map(r => r.questionId);

    // Get a question that hasn't been answered yet
    const query = this.questionRepo.createQueryBuilder('q');
    if (answeredQuestionIds.length > 0) {
      query.where('q.id NOT IN (:...answeredQuestionIds)', { answeredQuestionIds });
    }
    const nextQuestion = await query.orderBy('q.orderIndex', 'ASC').getOne();

    if (!nextQuestion) {
      return { complete: true };
    }

    return { complete: false, question: nextQuestion };
  }

  async submitAnswer(userId: string, dto: SubmitAnswerDto) {
    const session = await this.sessionRepo.findOne({ where: { id: dto.sessionId } });
    if (!session || session.userId !== userId) throw new ForbiddenException();

    const response = this.responseRepo.create({
      sessionId: dto.sessionId,
      questionId: dto.questionId,
      answerText: dto.answerText,
    });
    await this.responseRepo.save(response);

    // Enqueue extraction job
    await this.extractionQueue.add('extract-attributes', { responseId: response.id });

    return { success: true };
  }

  async completeInterview(userId: string, dto: CompleteInterviewDto) {
    const session = await this.sessionRepo.findOne({ where: { id: dto.sessionId } });
    if (!session || session.userId !== userId) throw new ForbiddenException();

    session.status = InterviewSessionStatus.COMPLETED;
    session.completedAt = new Date();
    await this.sessionRepo.save(session);

    await this.voiceProfileRepo.update(session.voiceProfileId, {
      status: VoiceProfileStatus.SYNTHESIZING,
    });

    return { success: true };
  }
}
