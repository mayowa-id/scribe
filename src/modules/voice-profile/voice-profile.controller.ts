import { Controller, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VoiceProfileService } from './voice-profile.service';

@ApiTags('Voice Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('voice-profiles')
export class VoiceProfileController {
  constructor(private readonly voiceProfileService: VoiceProfileService) {}

  @Get()
  @ApiOperation({ summary: 'List all voice profiles for the authenticated user' })
  findAll(@CurrentUser() user: any) {
    return this.voiceProfileService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single voice profile' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.voiceProfileService.findOne(id, user.id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Poll the synthesis status of a voice profile' })
  getStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.voiceProfileService.getStatus(id, user.id);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set a voice profile as the default for new chapters' })
  setDefault(@Param('id') id: string, @CurrentUser() user: any) {
    return this.voiceProfileService.setDefault(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a voice profile' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.voiceProfileService.delete(id, user.id);
  }
}
