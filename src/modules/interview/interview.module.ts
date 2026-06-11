import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewSession } from './entities/interview-session.entity';
import { InterviewQuestion } from './entities/interview-question.entity';
import { InterviewResponse } from './entities/interview-response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewSession, InterviewQuestion, InterviewResponse])],
  exports: [TypeOrmModule],
})
export class InterviewModule {}
