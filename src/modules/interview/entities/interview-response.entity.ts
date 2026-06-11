import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../infra/base-classes/base.entity';
import { ExtractionStatus } from '../../../shared/enums/enums';
import { InterviewSession } from './interview-session.entity';
import { InterviewQuestion } from './interview-question.entity';

@Entity('interview_responses')
export class InterviewResponse extends BaseEntity {
  @Column({ type: 'text' })
  rawAnswer: string;

  @Column({ type: 'jsonb', nullable: true })
  extractedData: any;

  @Column({ type: 'enum', enum: ExtractionStatus, default: ExtractionStatus.PENDING })
  extractionStatus: ExtractionStatus;

  @Column({ nullable: true })
  extractionModel: string;

  @Column()
  sessionId: string;

  @Column()
  questionId: string;

  @ManyToOne(() => InterviewSession, session => session.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: InterviewSession;

  @ManyToOne(() => InterviewQuestion, question => question.responses, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question: InterviewQuestion;
}
