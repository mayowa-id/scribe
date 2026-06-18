import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { VoiceProfile } from './entities/voice-profile.entity';
import { InterviewSession } from '../interview/entities/interview-session.entity';
import { InterviewResponse } from '../interview/entities/interview-response.entity';
import { User } from '../user/entities/user.entity';
import { VoiceProfileController } from './voice-profile.controller';
import { VoiceProfileService } from './voice-profile.service';
import { SynthesisProcessor } from './processors/synthesis.processor';
import { QUEUE_NAMES } from '../../common/constants';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoiceProfile,
      InterviewSession,
      InterviewResponse,
      User,
    ]),
    BullModule.registerQueue({ name: QUEUE_NAMES.SYNTHESIS }),
    AiModule,
    NotificationsModule,
  ],
  controllers: [VoiceProfileController],
  providers: [VoiceProfileService, SynthesisProcessor],
  exports: [TypeOrmModule, VoiceProfileService],
})
export class VoiceProfileModule {}
