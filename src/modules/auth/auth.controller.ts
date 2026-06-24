import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResponseUtil } from '../../utils/response.util';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    return ResponseUtil.success(data, 'Registration successful');
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return ResponseUtil.success(data, 'Login successful');
  }

  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    const data = await this.authService.refreshToken(refreshDto.refreshToken);
    return ResponseUtil.success(data, 'Token refreshed successfully');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: any) {
    await this.authService.logout(user.id);
    return ResponseUtil.success(null, 'Logged out successfully');
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const tokens = await this.authService.googleLogin(req);
    // Redirect to frontend with tokens in query params or cookie
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    return res.redirect(`${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }

  @Post('verify-email')
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    await this.authService.verifyEmail(verifyDto);
    return ResponseUtil.success(null, 'Email verified successfully');
  }

  @Get('admin/reset')
  async adminReset() {
    try {
      await this.dataSource.query('TRUNCATE TABLE users CASCADE');
      
      const checkRes = await this.dataSource.query('SELECT COUNT(*) FROM interview_questions');
      if (parseInt(checkRes[0].count) === 0) {
        await this.dataSource.query(`
          INSERT INTO interview_questions (category, "orderIndex", "questionText", "isActive") VALUES
          ('General', 0, 'Can you share a bit about your journey and how you found your voice in ministry?', true),
          ('Theological Framework', 1, 'What core theological themes do you find yourself returning to most often?', true),
          ('Personal Stories', 2, 'Share a defining moment in your life that deeply shaped your perspective on faith.', true)
        `);
      }
      return { success: true, message: 'Database reset and seeded successfully' };
    } catch (err: any) {
      return { success: false, message: 'Failed to reset db: ' + err.message };
    }
  }
}
