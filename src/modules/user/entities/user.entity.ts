import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../infra/base-classes/base.entity';
import { UserPlan, SubscriptionStatus } from '../../../shared/enums/enums';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { VoiceProfile } from '../../voice-profile/entities/voice-profile.entity';
import { InterviewSession } from '../../interview/entities/interview-session.entity';
import { Project } from '../../project/entities/project.entity';
import { Chapter } from '../../chapter/entities/chapter.entity';
import { GenerationJob } from '../../generation/entities/generation-job.entity';
import { ScribeAssistantMessage } from '../../scribe-assistant/entities/scribe-assistant-message.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.INACTIVE })
  subscriptionStatus: SubscriptionStatus;

  @Column({ nullable: true })
  paystackCustomerId: string;

  @Column({ nullable: true })
  paystackSubscriptionCode: string;

  @Column({ type: 'timestamptz', nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpiresAt: Date;

  // Relationships
  @OneToMany(() => RefreshToken, token => token.user, { cascade: true })
  refreshTokens: RefreshToken[];

  @OneToMany(() => VoiceProfile, profile => profile.user, { cascade: true })
  voiceProfiles: VoiceProfile[];

  @OneToMany(() => InterviewSession, session => session.user, { cascade: true })
  interviewSessions: InterviewSession[];

  @OneToMany(() => Project, project => project.user, { cascade: true })
  projects: Project[];

  @OneToMany(() => Chapter, chapter => chapter.user)
  chapters: Chapter[];

  @OneToMany(() => GenerationJob, job => job.user)
  generationJobs: GenerationJob[];

  @OneToMany(() => ScribeAssistantMessage, msg => msg.user, { cascade: true })
  assistantMessages: ScribeAssistantMessage[];
}
