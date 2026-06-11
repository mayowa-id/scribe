import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { GenerationJobStatus } from '../../../shared/enums/enums';
import { User } from '../../user/entities/user.entity';
import { Chapter } from '../../chapter/entities/chapter.entity';
import { VoiceProfile } from '../../voice-profile/entities/voice-profile.entity';

@Entity('generation_jobs')
export class GenerationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: GenerationJobStatus, default: GenerationJobStatus.QUEUED })
  status: GenerationJobStatus;

  @Column({ type: 'text' })
  promptUsed: string;

  @Column({ type: 'int', default: 0 })
  tokensInput: number;

  @Column({ type: 'int', default: 0 })
  tokensOutput: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column()
  userId: string;

  @Column()
  chapterId: string;

  @Column({ nullable: true })
  voiceProfileId: string;

  @ManyToOne(() => User, user => user.generationJobs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Chapter, chapter => chapter.generationJobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @ManyToOne(() => VoiceProfile, profile => profile.generationJobs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'voice_profile_id' })
  voiceProfile: VoiceProfile;
}
