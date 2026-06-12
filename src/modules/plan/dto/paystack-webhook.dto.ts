import { IsString, IsNotEmpty } from 'class-validator';

export class PaystackWebhookDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  data: Record<string, any>;
}
