import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GenerationJob } from './entities/generation-job.entity';
import { Chapter } from '../chapter/entities/chapter.entity';
import { ChapterVersion } from '../chapter/entities/chapter-version.entity';
import { VoiceProfile } from '../voice-profile/entities/voice-profile.entity';

import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GenerationJob, Chapter, ChapterVersion, VoiceProfile]),
  ],
  providers: [GenerationService],
  controllers: [GenerationController],
  exports: [GenerationService],
})
export class GenerationModule {}

