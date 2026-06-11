import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PLAN_KEY } from '../constants';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlan = this.reflector.getAllAndOverride<string>(REQUIRE_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlan) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.plan) {
      throw new ForbiddenException('User plan not found');
    }

    // Logic: premium > pro > free
    const planHierarchy = { free: 1, pro: 2, premium: 3 };
    const userPlanValue = planHierarchy[user.plan] || 0;
    const requiredPlanValue = planHierarchy[requiredPlan] || 0;

    if (userPlanValue < requiredPlanValue) {
      throw new ForbiddenException(`Requires ${requiredPlan} plan`);
    }

    return true;
  }
}
