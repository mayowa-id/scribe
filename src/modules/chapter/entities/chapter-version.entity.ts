import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ContentType } from '../../../shared/enums/enums';
import { Chapter } from './chapter.entity';

@Entity('chapter_versions')
export class ChapterVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  versionNumber: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ContentType, default: ContentType.AI_GENERATED })
  contentType: ContentType;

  @Column({ nullable: true })
  aiModel: string;

  @Column({ type: 'text', nullable: true })
  generationPrompt: string;

  @Column({ type: 'int', default: 0 })
  wordCount: number;

  @Column({ default: false })
  isCurrent: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column()
  chapterId: string;

  @ManyToOne(() => Chapter, chapter => chapter.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;
}
