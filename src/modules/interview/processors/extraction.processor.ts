import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiService } from '../../ai/ai.service';
import { InterviewResponse } from '../entities/interview-response.entity';
import { InterviewQuestion } from '../entities/interview-question.entity';
import { ExtractionStatus } from '../../../shared/enums';
import { QUEUE_NAMES } from '../../../common/constants';

@Processor(QUEUE_NAMES.EXTRACTION)
export class ExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(ExtractionProcessor.name);

  constructor(
    private readonly aiService: AiService,

    @InjectRepository(InterviewResponse)
    private responseRepo: Repository<InterviewResponse>,

    @InjectRepository(InterviewQuestion)
    private questionRepo: Repository<InterviewQuestion>,
  ) {
    super();
  }

  async process(job: Job<{ responseId: string }>): Promise<void> {
    const { responseId } = job.data;
    this.logger.log(`Processing extraction job for response ${responseId}`);

    // Load response + its question
    const response = await this.responseRepo.findOne({
      where: { id: responseId },
      relations: ['question'],
    });

    if (!response) {
      this.logger.warn(`Response ${responseId} not found — skipping`);
      return;
    }

    // Get extract fields from the question config
    const extractFields: string[] = response.question?.extractFields?.fields ?? [
      'tone',
      'style',
      'vocabulary',
    ];

    try {
      const extracted = await this.aiService.extractAttributes(response.rawAnswer, extractFields);

      await this.responseRepo.update(responseId, {
        extractedData: extracted,
        extractionStatus: ExtractionStatus.DONE,
        extractionModel: 'claude-haiku-4-5',
      });

      this.logger.log(`Extraction done for response ${responseId}`);
    } catch (err: any) {
      this.logger.error(`Extraction failed for response ${responseId}: ${err.message}`);
      await this.responseRepo.update(responseId, {
        extractionStatus: ExtractionStatus.FAILED,
      });
      throw err; // Let BullMQ handle retry
    }
  }
}
