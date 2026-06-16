import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { InterviewSession } from './entities/interview-session.entity';
import { InterviewQuestion } from './entities/interview-question.entity';
import { InterviewResponse } from './entities/interview-response.entity';
import { VoiceProfile } from '../voice-profile/entities/voice-profile.entity';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { ExtractionProcessor } from './processors/extraction.processor';
import { QUEUE_NAMES } from '../../common/constants';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InterviewSession,
      InterviewQuestion,
      InterviewResponse,
      VoiceProfile,
    ]),
    BullModule.registerQueue({ name: QUEUE_NAMES.EXTRACTION }),
    AiModule,
  ],
  controllers: [InterviewController],
  providers: [InterviewService, ExtractionProcessor],
  exports: [TypeOrmModule, InterviewService],
})
export class InterviewModule {}
