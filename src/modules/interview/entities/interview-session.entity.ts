import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../infra/base-classes/base.entity';
import { InterviewSessionStatus } from '../../../shared/enums/enums';
import { User } from '../../user/entities/user.entity';
import { VoiceProfile } from '../../voice-profile/entities/voice-profile.entity';
import { InterviewResponse } from './interview-response.entity';

@Entity('interview_sessions')
export class InterviewSession extends BaseEntity {
  @Column({ type: 'enum', enum: InterviewSessionStatus, default: InterviewSessionStatus.ACTIVE })
  status: InterviewSessionStatus;

  @Column({ type: 'int', default: 0 })
  currentQuestionIndex: number;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column()
  userId: string;

  @Column()
  voiceProfileId: string;

  @ManyToOne(() => User, user => user.interviewSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => VoiceProfile, profile => profile.interviewSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voice_profile_id' })
  voiceProfile: VoiceProfile;

  @OneToMany(() => InterviewResponse, response => response.session, { cascade: true })
  responses: InterviewResponse[];
}
