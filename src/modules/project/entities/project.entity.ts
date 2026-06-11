import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../infra/base-classes/base.entity';
import { User } from '../../user/entities/user.entity';
import { Chapter } from '../../chapter/entities/chapter.entity';

@Entity('projects')
export class Project extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  genre: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Chapter, chapter => chapter.project, { cascade: true })
  chapters: Chapter[];
}
