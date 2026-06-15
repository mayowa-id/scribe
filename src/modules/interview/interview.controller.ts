import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InterviewService } from './interview.service';
import { StartInterviewDto, SubmitAnswerDto, CompleteInterviewDto } from './dto/interview.dto';

@ApiTags('Interview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) { }

  @Post('start')
  @ApiOperation({})
  start(@CurrentUser() user: any, @Body() dto: StartInterviewDto) {
    return this.interviewService.startInterview(user.id, dto);
  }

  @Get('next-question')
  @ApiOperation({})
  nextQuestion(@CurrentUser() user: any, @Query('sessionId') sessionId: string) {
    return this.interviewService.getNextQuestion(sessionId, user.id);
  }

  @Post('answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({})
  submitAnswer(@CurrentUser() user: any, @Body() dto: SubmitAnswerDto) {
    return this.interviewService.submitAnswer(user.id, dto);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({})
  complete(@CurrentUser() user: any, @Body() dto: CompleteInterviewDto) {
    return this.interviewService.completeInterview(user.id, dto);
  }
}
