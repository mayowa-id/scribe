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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
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
}
