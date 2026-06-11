import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationJob } from './entities/generation-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GenerationJob])],
  exports: [TypeOrmModule],
})
export class GenerationModule {}
