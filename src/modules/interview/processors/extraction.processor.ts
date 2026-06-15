import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '../../../common/constants';
import { InterviewResponse } from '../entities/interview-response.entity';
import { InterviewSession } from '../entities/interview-session.entity';
import { VoiceProfile } from '../../voice-profile/entities/voice-profile.entity';
import { InterviewQuestion } from '../entities/interview-question.entity';
import { AiService } from '../../ai/ai.service';
import { ExtractionStatus } from '../../../shared/enums';

@Processor(QUEUE_NAMES.EXTRACTION)
export class ExtractionProcessor extends WorkerHost {
  constructor(
    @InjectRepository(InterviewResponse)
    private responseRepo: Repository<InterviewResponse>,
    @InjectRepository(InterviewQuestion)
    private questionRepo: Repository<InterviewQuestion>,
    @InjectRepository(InterviewSession)
    private sessionRepo: Repository<InterviewSession>,
    @InjectRepository(VoiceProfile)
    private voiceProfileRepo: Repository<VoiceProfile>,
    private aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<{ responseId: string }>) {
    const { responseId } = job.data;
    
    const response = await this.responseRepo.findOne({ where: { id: responseId } });
    if (!response) return;

    await this.responseRepo.update(responseId, { extractionStatus: ExtractionStatus.PENDING });

    const question = await this.questionRepo.findOne({ where: { id: response.questionId } });
    if (!question) return;

    try {
      const extractedData = await this.aiService.extractAttributes(
        response.rawAnswer,
        question.extractFields
      );

      await this.responseRepo.update(responseId, {
        extractedData,
        extractionStatus: ExtractionStatus.DONE,
      });

    } catch (err: any) {
      await this.responseRepo.update(responseId, { extractionStatus: ExtractionStatus.FAILED });
      throw err;
    }
  }
}
