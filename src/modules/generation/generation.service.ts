import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';

import { AiService } from '../ai/ai.service';
import { GenerationJob } from './entities/generation-job.entity';
import { Chapter } from '../chapter/entities/chapter.entity';
import { ChapterVersion } from '../chapter/entities/chapter-version.entity';
import { VoiceProfile } from '../voice-profile/entities/voice-profile.entity';
import { GenerationJobStatus, ContentType, VoiceProfileStatus } from '../../shared/enums';

export interface StartGenerationDto {
  chapterId: string;
  voiceProfileId?: string;
  userPrompt: string;
  context?: string;
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    private readonly aiService: AiService,

    @InjectRepository(GenerationJob)
    private jobRepo: Repository<GenerationJob>,

    @InjectRepository(Chapter)
    private chapterRepo: Repository<Chapter>,

    @InjectRepository(ChapterVersion)
    private versionRepo: Repository<ChapterVersion>,

    @InjectRepository(VoiceProfile)
    private voiceProfileRepo: Repository<VoiceProfile>,
  ) {}

  async createJob(userId: string, dto: StartGenerationDto): Promise<{ jobId: string }> {
    const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    if (chapter.userId !== userId) throw new ForbiddenException();

    // Resolve voice profile — use provided, fall back to chapter's, then user's default
    const voiceProfileId = dto.voiceProfileId ?? chapter.voiceProfileId ?? undefined;

    const job = this.jobRepo.create({
      userId,
      chapterId: dto.chapterId,
      voiceProfileId,
      status: GenerationJobStatus.QUEUED,
      promptUsed: dto.userPrompt,
    });
    await this.jobRepo.save(job);

    return { jobId: job.id };
  }

  /**
   * SSE stream handler — called by the controller with the Express Response object.
   * Streams generated text directly to the client, saves the chapter version on completion.
   */
  async streamGeneration(jobId: string, userId: string, res: Response): Promise<void> {
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      sendEvent({ type: 'error', message: 'Job not found' });
      res.end();
      return;
    }
    if (job.userId !== userId) {
      sendEvent({ type: 'error', message: 'Forbidden' });
      res.end();
      return;
    }

    // Load voice profile prompt
    let synthesizedPrompt = '';
    if (job.voiceProfileId) {
      const profile = await this.voiceProfileRepo.findOne({
        where: { id: job.voiceProfileId, status: VoiceProfileStatus.READY },
      });
      synthesizedPrompt = profile?.synthesizedPrompt ?? '';
    }

    await this.jobRepo.update(jobId, {
      status: GenerationJobStatus.STREAMING,
      startedAt: new Date(),
    });

    try {
      const stream = await this.aiService.streamChapterGeneration(
        synthesizedPrompt,
        job.promptUsed,
        undefined,
      );

      let fullText = '';

      if (stream) {
        for await (const chunk of stream) {
          fullText += chunk;
          sendEvent({ type: 'delta', text: chunk });
        }
      }

      // Save as a new chapter version
      // Mark existing versions as not current
      await this.versionRepo.update({ chapterId: job.chapterId, isCurrent: true }, { isCurrent: false });

      // Count existing versions
      const versionCount = await this.versionRepo.count({ where: { chapterId: job.chapterId } });
      const wordCount = fullText.trim().split(/\s+/).length;

      const version = this.versionRepo.create({
        chapterId: job.chapterId,
        versionNumber: versionCount + 1,
        content: fullText,
        contentType: ContentType.AI_GENERATED,
        aiModel: 'gemini-1.5-pro',
        generationPrompt: job.promptUsed,
        wordCount,
        isCurrent: true,
      });
      await this.versionRepo.save(version);

      // Update chapter word count
      await this.chapterRepo.update(job.chapterId, { wordCount });

      await this.jobRepo.update(jobId, {
        status: GenerationJobStatus.DONE,
        completedAt: new Date(),
        tokensOutput: wordCount, // approximate
      });

      sendEvent({ type: 'done', versionId: version.id, wordCount });
    } catch (err: any) {
      this.logger.error(`Generation stream error for job ${jobId}: ${err.message}`);
      await this.jobRepo.update(jobId, {
        status: GenerationJobStatus.FAILED,
        errorMessage: err.message,
        completedAt: new Date(),
      });
      sendEvent({ type: 'error', message: 'Generation failed. Please try again.' });
    } finally {
      res.end();
    }
  }

  async getJob(jobId: string, userId: string): Promise<GenerationJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new ForbiddenException();
    return job;
  }
}
