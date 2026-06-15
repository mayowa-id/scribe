import { Controller, Post, Get, Param, Body, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ScribeAssistantService, ChatMessageDto } from './scribe-assistant.service';

@ApiTags('Scribe Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scribe-assistant')
export class ScribeAssistantController {
  constructor(private readonly scribeAssistantService: ScribeAssistantService) { }

  @Post('chat')
  @ApiOperation({ summary: 'SSE — send a message to the chapter-aware assistant' })
  async chat(@CurrentUser() user: any, @Body() dto: ChatMessageDto, @Res() res: Response) {
    await this.scribeAssistantService.streamChat(user.id, dto, res);
  }

  @Get('history/:chapterId')
  @ApiOperation({ summary: 'Get conversation history for a chapter' })
  getHistory(@Param('chapterId') chapterId: string, @CurrentUser() user: any) {
    return this.scribeAssistantService.getHistory(chapterId, user.id);
  }
}