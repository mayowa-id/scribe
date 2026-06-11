import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../infra/base-classes/base.entity';

@Entity('plans')
export class Plan extends BaseEntity {
  @Column({ unique: true })
  name: string; // e.g. 'free', 'pro', 'premium'

  @Column()
  displayName: string;

  @Column({ type: 'int' })
  priceMonthlyKobo: number;

  @Column({ nullable: true })
  paystackPlanCode: string;

  @Column({ type: 'jsonb', default: {} })
  features: any;

  @Column({ type: 'int', default: 1 })
  maxVoiceProfiles: number;

  @Column({ type: 'int', default: 1 })
  maxProjects: number;

  @Column({ type: 'int', default: 5 })
  maxChaptersPerProject: number;

  @Column({ type: 'int', default: 3 })
  maxGenerationsPerMonth: number;
}
