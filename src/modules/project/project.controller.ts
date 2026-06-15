import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectService, CreateProjectDto, UpdateProjectDto } from './project.service';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  findAll(@CurrentUser() user: any) {
    return this.projectService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@CurrentUser() user: any, @Body() dto: CreateProjectDto) {
    return this.projectService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateProjectDto) {
    return this.projectService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectService.delete(id, user.id);
  }
}