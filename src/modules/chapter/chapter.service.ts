import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Chapter } from './entities/chapter.entity';
import { ChapterVersion } from './entities/chapter-version.entity';

export class CreateChapterDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty({ required: false }) @IsInt() @Min(0) @IsOptional() orderIndex?: number;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() voiceProfileId?: string;
}

export class UpdateChapterDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() title?: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() voiceProfileId?: string;
}

@Injectable()
export class ChapterService {
  constructor(
    @InjectRepository(Chapter)
    private chapterRepo: Repository<Chapter>,
    @InjectRepository(ChapterVersion)
    private versionRepo: Repository<ChapterVersion>,
  ) { }

  async findAllForProject(projectId: string, userId: string): Promise<Chapter[]> {
    return this.chapterRepo.find({
      where: { projectId, userId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({
      where: { id },
      relations: ['versions'],
    });
    if (!chapter) throw new NotFoundException('Chapter not found');
    if (chapter.userId !== userId) throw new ForbiddenException();
    return chapter;
  }

  async create(userId: string, dto: CreateChapterDto): Promise<Chapter> {
    const count = await this.chapterRepo.count({ where: { projectId: dto.projectId } });
    const chapter = this.chapterRepo.create({
      ...dto,
      userId,
      orderIndex: dto.orderIndex ?? count,
    });
    return this.chapterRepo.save(chapter);
  }

  async update(id: string, userId: string, dto: UpdateChapterDto): Promise<Chapter> {
    const chapter = await this.findOne(id, userId);
    Object.assign(chapter, dto);
    return this.chapterRepo.save(chapter);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const chapter = await this.findOne(id, userId);
    await this.chapterRepo.remove(chapter);
    return { success: true };
  }

  async getVersions(chapterId: string, userId: string): Promise<ChapterVersion[]> {
    await this.findOne(chapterId, userId); // auth check
    return this.versionRepo.find({
      where: { chapterId },
      order: { versionNumber: 'DESC' },
      select: ['id', 'versionNumber', 'contentType', 'wordCount', 'isCurrent', 'createdAt'],
    });
  }

  async getVersion(chapterId: string, versionId: string, userId: string): Promise<ChapterVersion> {
    await this.findOne(chapterId, userId); // auth check
    const version = await this.versionRepo.findOne({ where: { id: versionId, chapterId } });
    if (!version) throw new NotFoundException('Version not found');
    return version;
  }
}