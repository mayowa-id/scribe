import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChapterService, CreateChapterDto, UpdateChapterDto } from './chapter.service';

@ApiTags('Chapters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chapters')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) { }

  @Get()
  @ApiOperation({ summary: 'List all chapters for a project' })
  findAll(@CurrentUser() user: any, @Query('projectId') projectId: string) {
    return this.chapterService.findAllForProject(projectId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chapter by ID (includes versions list)' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chapterService.findOne(id, user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history for a chapter' })
  getVersions(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chapterService.getVersions(id, user.id);
  }

  @Get(':id/versions/:versionId')
  @ApiOperation({ summary: 'Get full content of a specific version' })
  getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: any,
  ) {
    return this.chapterService.getVersion(id, versionId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new chapter' })
  create(@CurrentUser() user: any, @Body() dto: CreateChapterDto) {
    return this.chapterService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update chapter metadata' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateChapterDto) {
    return this.chapterService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chapter and all its versions' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chapterService.delete(id, user.id);
  }
}