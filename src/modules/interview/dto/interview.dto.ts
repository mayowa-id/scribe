import { IsString, IsUUID, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartInterviewDto {
  @ApiProperty({ example: 'Sunday Sermon Voice' })
  @IsString()
  @IsNotEmpty()
  voiceProfileName: string;

  @ApiProperty({ example: 'My primary preaching voice', required: false })
  @IsString()
  description?: string;
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsUUID()
  sessionId: string;

  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty({ example: 'I always open with a story that establishes tension...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Answer is too short. Please elaborate.' })
  rawAnswer: string;
}

export class CompleteInterviewDto {
  @ApiProperty()
  @IsUUID()
  sessionId: string;
}
