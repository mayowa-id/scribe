import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScribeAssistantMessage } from './entities/scribe-assistant-message.entity';
import { Chapter } from '../chapter/entities/chapter.entity';
import { ChapterVersion } from '../chapter/entities/chapter-version.entity';
import { VoiceProfile } from '../voice-profile/entities/voice-profile.entity';
import { ScribeAssistantService } from './scribe-assistant.service';
import { ScribeAssistantController } from './scribe-assistant.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScribeAssistantMessage, Chapter, ChapterVersion, VoiceProfile]),
  ],
  providers: [ScribeAssistantService],
  controllers: [ScribeAssistantController],
})
export class ScribeAssistantModule { }
