import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScribeAssistantMessage } from './entities/scribe-assistant-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScribeAssistantMessage])],
  exports: [TypeOrmModule],
})
export class ScribeAssistantModule {}
