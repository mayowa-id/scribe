import { IsString, IsNotEmpty } from 'class-validator';

export class InitiateUpgradeDto {
  @IsString()
  @IsNotEmpty()
  plan: string; // 'pro' or 'premium'
}
