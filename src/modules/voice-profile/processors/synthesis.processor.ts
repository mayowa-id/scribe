import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiService } from '../../ai/ai.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { VoiceProfile } from '../entities/voice-profile.entity';
import { InterviewResponse } from '../../interview/entities/interview-response.entity';
import { InterviewSession } from '../../interview/entities/interview-session.entity';
import { User } from '../../user/entities/user.entity';
import { VoiceProfileStatus, ExtractionStatus } from '../../../shared/enums';
import { voiceReadyTemplate } from '../templates/voice-ready.template';
import { QUEUE_NAMES } from '../../../common/constants';
import { ConfigService } from '@nestjs/config';

@Processor(QUEUE_NAMES.SYNTHESIS)
export class SynthesisProcessor extends WorkerHost {
  private readonly logger = new Logger(SynthesisProcessor.name);

  constructor(
    private readonly aiService: AiService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,

    @InjectRepository(VoiceProfile)
    private voiceProfileRepo: Repository<VoiceProfile>,

    @InjectRepository(InterviewSession)
    private sessionRepo: Repository<InterviewSession>,

    @InjectRepository(InterviewResponse)
    private responseRepo: Repository<InterviewResponse>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    super();
  }

  async process(job: Job<{ voiceProfileId: string; sessionId: string }>): Promise<void> {
    const { voiceProfileId, sessionId } = job.data;
    this.logger.log(`Starting synthesis for voice profile ${voiceProfileId}`);

    // Wait for all extractions to complete (poll with timeout)
    const maxWaitMs = 2 * 60 * 1000; // 2 minutes
    const pollIntervalMs = 3000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const pendingCount = await this.responseRepo.count({
        where: { sessionId, extractionStatus: ExtractionStatus.PENDING },
      });
      if (pendingCount === 0) break;
      this.logger.log(`Waiting for ${pendingCount} extractions to complete...`);
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    // Gather all extracted data
    const responses = await this.responseRepo.find({
      where: { sessionId, extractionStatus: ExtractionStatus.DONE },
    });

    if (responses.length === 0) {
      this.logger.warn(`No completed extractions found for session ${sessionId}`);
      await this.voiceProfileRepo.update(voiceProfileId, {
        status: VoiceProfileStatus.FAILED,
      });
      return;
    }

    // Merge all extracted attributes
    const mergedAttributes: Record<string, any> = {};
    for (const response of responses) {
      if (response.extractedData) {
        Object.assign(mergedAttributes, response.extractedData);
      }
    }

    try {
      // Synthesize the voice profile system prompt
      const synthesizedPrompt = await this.aiService.synthesizeVoiceProfile(mergedAttributes);

      // Load the voice profile to get version and user info
      const voiceProfile = await this.voiceProfileRepo.findOne({
        where: { id: voiceProfileId },
      });

      await this.voiceProfileRepo.update(voiceProfileId, {
        synthesizedPrompt,
        rawAttributes: mergedAttributes,
        status: VoiceProfileStatus.READY,
        promptVersion: (voiceProfile?.promptVersion ?? 0) + 1,
      });

      this.logger.log(`Voice profile ${voiceProfileId} synthesised successfully`);

      // Send the "voice ready" email
      const user = await this.userRepo.findOne({ where: { id: voiceProfile!.userId } });
      if (user) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
        const template = voiceReadyTemplate(
          user.fullName,
          voiceProfile!.name,
          `${frontendUrl}/dashboard`,
        );
        await this.notificationsService.send({
          recipient: user.email,
          subject: template.subject,
          body: template.body,
          idempotencyKey: `voice-ready-${voiceProfileId}-v${(voiceProfile?.promptVersion ?? 0) + 1}`,
        });
      }
    } catch (err: any) {
      this.logger.error(`Synthesis failed for ${voiceProfileId}: ${err.message}`);
      await this.voiceProfileRepo.update(voiceProfileId, {
        status: VoiceProfileStatus.FAILED,
      });
      throw err;
    }
  }
}
