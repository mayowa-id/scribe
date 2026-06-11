import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../infra/base-classes/base.entity';
import { InterviewResponse } from './interview-response.entity';

@Entity('interview_questions')
export class InterviewQuestion extends BaseEntity {
  @Column({ type: 'int' })
  orderIndex: number;

  @Column()
  category: string;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'text', nullable: true })
  followUpHint: string;

  @Column({ type: 'jsonb', nullable: true })
  extractFields: any;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => InterviewResponse, response => response.question)
  responses: InterviewResponse[];
}
