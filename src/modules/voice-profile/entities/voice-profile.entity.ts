import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../infra/base-classes/base.entity';
import { VoiceProfileStatus } from '../../../shared/enums/enums';
import { User } from '../../user/entities/user.entity';
import { InterviewSession } from '../../interview/entities/interview-session.entity';
import { Chapter } from '../../chapter/entities/chapter.entity';
import { GenerationJob } from '../../generation/entities/generation-job.entity';

@Entity('voice_profiles')
export class VoiceProfile extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: VoiceProfileStatus, default: VoiceProfileStatus.DRAFT })
  status: VoiceProfileStatus;

  @Column({ type: 'text', nullable: true })
  synthesizedPrompt: string;

  @Column({ type: 'int', default: 1 })
  promptVersion: number;

  @Column({ type: 'jsonb', nullable: true })
  rawAttributes: any;

  @Column({ default: false })
  isDefault: boolean;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.voiceProfiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => InterviewSession, session => session.voiceProfile, { cascade: true })
  interviewSessions: InterviewSession[];

  @OneToMany(() => Chapter, chapter => chapter.voiceProfile)
  chapters: Chapter[];

  @OneToMany(() => GenerationJob, job => job.voiceProfile)
  generationJobs: GenerationJob[];
}
