import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GenerationService, StartGenerationDto } from './generation.service';

@ApiTags('Generation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('generate')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a generation job and return a jobId for streaming' })
  createJob(@CurrentUser() user: any, @Body() dto: StartGenerationDto) {
    return this.generationService.createJob(user.id, dto);
  }

  @Get('stream/:jobId')
  @ApiOperation({ summary: 'SSE stream — connect to get generated text in real time' })
  async stream(
    @Param('jobId') jobId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    await this.generationService.streamGeneration(jobId, user.id, res);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get the status of a generation job' })
  getJob(@Param('jobId') jobId: string, @CurrentUser() user: any) {
    return this.generationService.getJob(jobId, user.id);
  }
}
