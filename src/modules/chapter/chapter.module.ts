import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { ChapterVersion } from './entities/chapter-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, ChapterVersion])],
  exports: [TypeOrmModule],
})
export class ChapterModule {}
