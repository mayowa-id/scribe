import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VoiceProfile } from './entities/voice-profile.entity';
import { VoiceProfileStatus } from '../../shared/enums';

@Injectable()
export class VoiceProfileService {
  constructor(
    @InjectRepository(VoiceProfile)
    private voiceProfileRepo: Repository<VoiceProfile>,
  ) {}

  async findAllForUser(userId: string) {
    return this.voiceProfileRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string) {
    const profile = await this.voiceProfileRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Voice profile not found');
    if (profile.userId !== userId) throw new ForbiddenException();
    return profile;
  }

  async getStatus(id: string, userId: string) {
    const profile = await this.findOne(id, userId);
    return { status: profile.status };
  }

  async setDefault(id: string, userId: string) {
    const profile = await this.findOne(id, userId);
    if (profile.status !== VoiceProfileStatus.READY) {
      throw new BadRequestException('Only ready profiles can be set as default');
    }

    // Reset current default
    await this.voiceProfileRepo.update({ userId, isDefault: true }, { isDefault: false });
    
    // Set new default
    profile.isDefault = true;
    await this.voiceProfileRepo.save(profile);
    return { success: true };
  }

  async delete(id: string, userId: string) {
    const profile = await this.findOne(id, userId);
    await this.voiceProfileRepo.remove(profile);
    return { success: true };
  }
}
