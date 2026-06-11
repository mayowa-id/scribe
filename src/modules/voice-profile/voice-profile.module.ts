import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceProfile } from './entities/voice-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VoiceProfile])],
  exports: [TypeOrmModule],
})
export class VoiceProfileModule {}
