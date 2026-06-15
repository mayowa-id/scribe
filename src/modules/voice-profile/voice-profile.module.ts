import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { VoiceProfile } from './entities/voice-profile.entity';
import { InterviewResponse } from '../interview/entities/interview-response.entity';
import { InterviewSession } from '../interview/entities/interview-session.entity';
import { User } from '../user/entities/user.entity';

import { VoiceProfileService } from './voice-profile.service';
import { VoiceProfileController } from './voice-profile.controller';
import { SynthesisProcessor } from './processors/synthesis.processor';
import { QUEUE_NAMES } from '../../common/constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoiceProfile, InterviewResponse, InterviewSession, User]),
    BullModule.registerQueue({ name: QUEUE_NAMES.SYNTHESIS }),
  ],
  providers: [VoiceProfileService, SynthesisProcessor],
  controllers: [VoiceProfileController],
  exports: [VoiceProfileService],
})
export class VoiceProfileModule {}
