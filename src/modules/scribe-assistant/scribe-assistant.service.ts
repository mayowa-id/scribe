import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { AiService } from '../ai/ai.service';
import { ScribeAssistantMessage } from './entities/scribe-assistant-message.entity';
import { Chapter } from '../chapter/entities/chapter.entity';
import { ChapterVersion } from '../chapter/entities/chapter-version.entity';
import { VoiceProfile } from '../voice-profile/entities/voice-profile.entity';
import { ScribeMessageRole, VoiceProfileStatus } from '../../shared/enums';

export class ChatMessageDto {
  @ApiProperty() @IsString() chapterId: string;
  @ApiProperty() @IsString() @IsNotEmpty() message: string;
  @ApiProperty({ required: false }) @IsInt() @Min(1) @Max(20) @IsOptional() historyLimit?: number;
}

@Injectable()
export class ScribeAssistantService {
  constructor(
    private readonly aiService: AiService,

    @InjectRepository(ScribeAssistantMessage)
    private messageRepo: Repository<ScribeAssistantMessage>,

    @InjectRepository(Chapter)
    private chapterRepo: Repository<Chapter>,

    @InjectRepository(ChapterVersion)
    private versionRepo: Repository<ChapterVersion>,

    @InjectRepository(VoiceProfile)
    private voiceProfileRepo: Repository<VoiceProfile>,
  ) {}

  async streamChat(userId: string, dto: ChatMessageDto, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
    if (!chapter || chapter.userId !== userId) {
      sendEvent({ type: 'error', message: 'Chapter not found' });
      res.end();
      return;
    }

    // Load current chapter version content
    const currentVersion = await this.versionRepo.findOne({
      where: { chapterId: dto.chapterId, isCurrent: true },
    });
    const chapterContent = currentVersion?.content ?? '(No content yet)';

    // Load voice profile prompt
    let synthesizedPrompt = '';
    if (chapter.voiceProfileId) {
      const profile = await this.voiceProfileRepo.findOne({
        where: { id: chapter.voiceProfileId, status: VoiceProfileStatus.READY },
      });
      synthesizedPrompt = profile?.synthesizedPrompt ?? '';
    }

    // Load conversation history
    const limit = dto.historyLimit ?? 10;
    const history = await this.messageRepo.find({
      where: { chapterId: dto.chapterId, userId },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    const conversationHistory = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Save user message
    await this.messageRepo.save(
      this.messageRepo.create({
        chapterId: dto.chapterId,
        userId,
        role: ScribeMessageRole.USER,
        content: dto.message,
      }),
    );

    try {
      const stream = await this.aiService.streamAssistantResponse(
        synthesizedPrompt,
        chapterContent,
        conversationHistory,
        dto.message,
      );

      let fullResponse = '';
      if (stream) {
        for await (const chunk of stream) {
          fullResponse += chunk;
          sendEvent({ type: 'delta', text: chunk });
        }
      }

      // Save assistant response
      await this.messageRepo.save(
        this.messageRepo.create({
          chapterId: dto.chapterId,
          userId,
          role: ScribeMessageRole.ASSISTANT,
          content: fullResponse,
        }),
      );

      sendEvent({ type: 'done' });
    } catch (err: any) {
      sendEvent({ type: 'error', message: 'Assistant encountered an error. Please try again.' });
    } finally {
      res.end();
    }
  }

  async getHistory(chapterId: string, userId: string): Promise<ScribeAssistantMessage[]> {
    const chapter = await this.chapterRepo.findOne({ where: { id: chapterId } });
    if (!chapter || chapter.userId !== userId) throw new ForbiddenException();

    return this.messageRepo.find({
      where: { chapterId, userId },
      order: { createdAt: 'ASC' },
    });
  }
}
