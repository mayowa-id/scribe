import { IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartInterviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsUUID()
  sessionId: string;

  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  answerText: string;
}

export class CompleteInterviewDto {
  @ApiProperty()
  @IsUUID()
  sessionId: string;
}
