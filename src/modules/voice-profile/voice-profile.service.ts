import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async findAllForUser(userId: string): Promise<VoiceProfile[]> {
    return this.voiceProfileRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<VoiceProfile> {
    const profile = await this.voiceProfileRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Voice profile not found');
    if (profile.userId !== userId) throw new ForbiddenException();
    return profile;
  }

  async setDefault(id: string, userId: string): Promise<VoiceProfile> {
    const profile = await this.findOne(id, userId);

    // Clear any existing default
    await this.voiceProfileRepo.update({ userId, isDefault: true }, { isDefault: false });

    profile.isDefault = true;
    return this.voiceProfileRepo.save(profile);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const profile = await this.findOne(id, userId);
    await this.voiceProfileRepo.remove(profile);
    return { success: true };
  }

  async getStatus(id: string, userId: string): Promise<{ id: string; status: VoiceProfileStatus; promptVersion: number }> {
    const profile = await this.findOne(id, userId);
    return {
      id: profile.id,
      status: profile.status,
      promptVersion: profile.promptVersion,
    };
  }
}
