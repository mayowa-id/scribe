import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { HashUtil } from '../../utils/hash.util';
import { TokenUtil } from '../../utils/token.util';
import { NotificationsService } from '../notifications/notifications.service';
import { WelcomeEmailTemplate } from '../notifications/templates/welcome.template';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await HashUtil.hash(registerDto.password);

    const user = await this.userService.create({
      email: registerDto.email,
      passwordHash,
      fullName: registerDto.fullName,
    });

    // Send welcome email (fire and forget)
    this.notificationsService.send({
      recipient: user.email,
      subject: WelcomeEmailTemplate.subject,
      body: WelcomeEmailTemplate.buildBody(user.fullName),
      idempotencyKey: `welcome-${user.id}`,
    }).catch(() => {});

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await HashUtil.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new BadRequestException('No user from google');
    }

    const { email, firstName, lastName, picture, googleId } = req.user;
    let user = await this.userService.findByEmail(email);

    if (!user) {
      user = await this.userService.create({
        email,
        googleId,
        fullName: `${firstName} ${lastName}`,
        avatarUrl: picture,
      });
    } else if (!user.googleId) {
      // Existing email-registered user — link their Google account
      user.googleId = googleId;
      user.avatarUrl = user.avatarUrl || picture;
      user = await this.userService.save(user);
    }

    return this.generateTokens(user);
  }

  async refreshToken(token: string) {
    const hashedToken = TokenUtil.hashToken(token);

    const refreshTokenRecord = await this.refreshTokenRepository
      .createQueryBuilder('rt')
      .leftJoinAndSelect('rt.user', 'user')
      .where('rt.tokenHash = :hashedToken', { hashedToken })
      .andWhere('rt.revoked = :revoked', { revoked: false })
      .getOne();

    if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke the old token
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked: true })
      .where('id = :id', { id: refreshTokenRecord.id })
      .execute();

    return this.generateTokens(refreshTokenRecord.user);
  }

  async logout(userId: string) {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked: true })
      .where('userId = :userId', { userId })
      .execute();

    return { success: true };
  }

  private async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenStr = TokenUtil.generateRandomToken();
    const tokenHash = TokenUtil.hashToken(refreshTokenStr);

    // Parse expiry string like "7d" -> 7 days
    const expiresInStr = this.configService.get<string>('AUTH_REFRESH_EXPIRESIN', '7d');
    const days = parseInt(expiresInStr.replace('d', ''), 10) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      tokenHash,
      expiresAt,
      userId: user.id,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: refreshTokenStr,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        plan: user.plan,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
