import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ChapterStatus } from '../../../shared/enums/enums';
import { BaseEntity } from '../../../infra/base-classes/base.entity';
import { User } from '../../user/entities/user.entity';
import { Project } from '../../project/entities/project.entity';
import { VoiceProfile } from '../../voice-profile/entities/voice-profile.entity';
import { ChapterVersion } from './chapter-version.entity';
import { GenerationJob } from '../../generation/entities/generation-job.entity';
import { ScribeAssistantMessage } from '../../scribe-assistant/entities/scribe-assistant-message.entity';

@Entity('chapters')
export class Chapter extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'int' })
  orderIndex: number;

  @Column({ type: 'enum', enum: ChapterStatus, default: ChapterStatus.OUTLINE })
  status: ChapterStatus;

  @Column({ type: 'int', default: 0 })
  wordCount: number;

  @Column()
  projectId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  voiceProfileId: string;

  @ManyToOne(() => Project, project => project.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, user => user.chapters, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => VoiceProfile, profile => profile.chapters, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'voice_profile_id' })
  voiceProfile: VoiceProfile;

  @OneToMany(() => ChapterVersion, version => version.chapter, { cascade: true })
  versions: ChapterVersion[];

  @OneToMany(() => GenerationJob, job => job.chapter, { cascade: true })
  generationJobs: GenerationJob[];

  @OneToMany(() => ScribeAssistantMessage, message => message.chapter, { cascade: true })
  assistantMessages: ScribeAssistantMessage[];
}
