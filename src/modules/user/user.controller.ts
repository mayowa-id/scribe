import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseUtil } from '../../utils/response.util';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    const userProfile = await this.userService.findById(user.id);
    // Remove sensitive data before returning
    delete userProfile.passwordHash;
    return ResponseUtil.success(userProfile);
  }

  @Put('me')
  async updateProfile(@CurrentUser() user: any, @Body() updateDto: UpdateUserDto) {
    const updatedUser = await this.userService.updateProfile(user.id, updateDto);
    delete updatedUser.passwordHash;
    return ResponseUtil.success(updatedUser, 'Profile updated successfully');
  }
}
