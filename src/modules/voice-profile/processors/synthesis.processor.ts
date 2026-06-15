import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '../../../common/constants';
import { VoiceProfile } from '../entities/voice-profile.entity';
import { InterviewSession } from '../../interview/entities/interview-session.entity';
import { InterviewResponse } from '../../interview/entities/interview-response.entity';
import { AiService } from '../../ai/ai.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { User } from '../../user/entities/user.entity';
import { VoiceReadyTemplate } from '../../notifications/templates/voice-ready.template';
import { ConfigService } from '@nestjs/config';
import { VoiceProfileStatus } from '../../../shared/enums';

@Processor(QUEUE_NAMES.SYNTHESIS)
export class SynthesisProcessor extends WorkerHost {
  constructor(
    @InjectRepository(VoiceProfile)
    private voiceProfileRepo: Repository<VoiceProfile>,
    @InjectRepository(InterviewSession)
    private sessionRepo: Repository<InterviewSession>,
    @InjectRepository(InterviewResponse)
    private responseRepo: Repository<InterviewResponse>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private aiService: AiService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ voiceProfileId: string }>) {
    const { voiceProfileId } = job.data;

    const profile = await this.voiceProfileRepo.findOne({ where: { id: voiceProfileId } });
    if (!profile) return;

    try {
      const session = await this.sessionRepo.findOne({ where: { voiceProfileId } });
      if (!session) throw new Error('No interview session found for profile');

      const responses = await this.responseRepo.find({ where: { sessionId: session.id } });
      
      const allAttributes = responses.reduce((acc, r) => {
        return { ...acc, ...(r.extractedAttributes || {}) };
      }, {} as Record<string, any>);

      const synthesizedPrompt = await this.aiService.synthesizeVoiceProfile(allAttributes);

      await this.voiceProfileRepo.update(voiceProfileId, {
        synthesizedPrompt,
        status: VoiceProfileStatus.READY,
      });

      // Send email
      const user = await this.userRepo.findOne({ where: { id: profile.userId } });
      if (user) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');
        this.notificationsService.send({
          recipient: user.email,
          subject: VoiceReadyTemplate.subject,
          body: VoiceReadyTemplate.buildBody(user.fullName, profile.name, `${frontendUrl}/projects`),
          idempotencyKey: `voice-ready-${profile.id}`,
        }).catch(() => {});
      }

    } catch (err: any) {
      await this.voiceProfileRepo.update(voiceProfileId, { status: VoiceProfileStatus.FAILED });
      throw err;
    }
  }
}
