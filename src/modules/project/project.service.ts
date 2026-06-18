import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from './entities/project.entity';

export class CreateProjectDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() genre?: string;
}

export class UpdateProjectDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() title?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() genre?: string;
}

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) { }

  async findAll(userId: string): Promise<Project[]> {
    return this.projectRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException();
    return project;
  }

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepo.create({ ...dto, userId });
    return this.projectRepo.save(project);
  }

  async update(id: string, userId: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id, userId);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const project = await this.findOne(id, userId);
    await this.projectRepo.remove(project);
    return { success: true };
  }
}