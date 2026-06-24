import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector, private dataSource: DataSource) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    try {
      // DEMO BYPASS: Fetch the first user from the DB and attach to request
      const users = await this.dataSource.query('SELECT id, email, plan FROM users LIMIT 1');
      if (users && users.length > 0) {
        request.user = users[0];
      } else {
        const demoId = '00000000-0000-0000-0000-000000000000';
        await this.dataSource.query(
          `INSERT INTO users (id, email, password, first_name, last_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
          [demoId, 'demo@example.com', 'dummy_hash', 'Demo', 'User']
        );
        request.user = { id: demoId, email: 'demo@example.com', plan: 'PRO' };
      }
    } catch (e) {
      console.error('Error in Demo Auth Bypass:', e);
      // Fallback
      request.user = { id: '00000000-0000-0000-0000-000000000000', email: 'demo@example.com', plan: 'PRO' };
    }

    return true;
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      // return a dummy user to bypass auth
      return { id: '00000000-0000-0000-0000-000000000000', email: 'demo@example.com', plan: 'PRO' };
    }
    return user;
  }
}
