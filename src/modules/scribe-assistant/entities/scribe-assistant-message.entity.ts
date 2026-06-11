import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ScribeMessageRole } from '../../../shared/enums/enums';
import { User } from '../../user/entities/user.entity';
import { Chapter } from '../../chapter/entities/chapter.entity';

@Entity('scribe_assistant_messages')
export class ScribeAssistantMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ScribeMessageRole })
  role: ScribeMessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  tokensUsed: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column()
  userId: string;

  @Column()
  chapterId: string;

  @ManyToOne(() => User, user => user.assistantMessages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Chapter, chapter => chapter.assistantMessages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;
}
