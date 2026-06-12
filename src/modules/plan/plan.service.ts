import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Plan } from './entities/plan.entity';
import { User } from '../user/entities/user.entity';
import { UserPlan, SubscriptionStatus } from '../../shared/enums';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async getAllPlans(): Promise<Plan[]> {
    return this.planRepository
      .createQueryBuilder('plan')
      .orderBy('plan.priceMonthlyKobo', 'ASC')
      .getMany();
  }

  async getPlanByName(name: string): Promise<Plan> {
    const plan = await this.planRepository
      .createQueryBuilder('plan')
      .where('plan.name = :name', { name })
      .getOne();

    if (!plan) {
      throw new NotFoundException(`Plan '${name}' not found`);
    }
    return plan;
  }

  async getCurrentPlan(userId: string): Promise<{ user: Partial<User>; plan: Plan | null }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.plan',
        'user.subscriptionStatus',
        'user.subscriptionExpiresAt',
        'user.paystackSubscriptionCode',
      ])
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.planRepository
      .createQueryBuilder('plan')
      .where('plan.name = :name', { name: user.plan })
      .getOne();

    return { user, plan };
  }

  async initiateUpgrade(userId: string, targetPlanName: string): Promise<{ authorizationUrl: string }> {
    if (targetPlanName === UserPlan.FREE) {
      throw new BadRequestException('Cannot upgrade to the free plan');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.paystackCustomerId', 'user.plan'])
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const targetPlan = await this.getPlanByName(targetPlanName);

    if (!targetPlan.paystackPlanCode) {
      throw new BadRequestException(`Plan '${targetPlanName}' is not available for purchase`);
    }

    const authorizationUrl = await this.createPaystackSession(
      user.email,
      targetPlan.priceMonthlyKobo,
      targetPlan.paystackPlanCode,
      userId,
    );

    return { authorizationUrl };
  }

  async handleWebhook(event: string, data: Record<string, any>): Promise<void> {
    switch (event) {
      case 'charge.success':
        await this.handleChargeSuccess(data);
        break;
      case 'subscription.disable':
        await this.handleSubscriptionDisable(data);
        break;
      case 'subscription.not_renew':
        await this.handleSubscriptionDisable(data);
        break;
      default:
        // Unhandled event — ignore silently
        break;
    }
  }

  async cancelSubscription(userId: string): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        plan: UserPlan.FREE,
        subscriptionStatus: SubscriptionStatus.CANCELLED,
        paystackSubscriptionCode: null,
        subscriptionExpiresAt: null,
      })
      .where('id = :userId', { userId })
      .execute();
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  private async createPaystackSession(
    email: string,
    amountKobo: number,
    planCode: string,
    userId: string,
  ): Promise<string> {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    const callbackUrl = `${this.configService.get<string>('FRONTEND_URL')}/billing/callback`;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        plan: planCode,
        callback_url: callbackUrl,
        metadata: { userId },
      }),
    });

    const body = (await response.json()) as { status: boolean; data: { authorization_url: string } };

    if (!body.status) {
      throw new BadRequestException('Failed to initialize Paystack transaction');
    }

    return body.data.authorization_url;
  }

  private async handleChargeSuccess(data: Record<string, any>): Promise<void> {
    const userId: string = data?.metadata?.userId;
    const subscriptionCode: string = data?.subscription_code;
    const planName: string | undefined = data?.plan?.name?.toLowerCase();

    if (!userId || !planName) return;

    const validPlans: string[] = Object.values(UserPlan);
    const resolvedPlan = validPlans.includes(planName) ? (planName as UserPlan) : null;
    if (!resolvedPlan) return;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        plan: resolvedPlan as UserPlan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        paystackSubscriptionCode: subscriptionCode ?? null,
        subscriptionExpiresAt: expiresAt,
      })
      .where('id = :userId', { userId })
      .execute();
  }

  private async handleSubscriptionDisable(data: Record<string, any>): Promise<void> {
    const subscriptionCode: string = data?.subscription_code;
    if (!subscriptionCode) return;

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        plan: UserPlan.FREE,
        subscriptionStatus: SubscriptionStatus.CANCELLED,
        paystackSubscriptionCode: null,
        subscriptionExpiresAt: null,
      })
      .where('paystackSubscriptionCode = :subscriptionCode', { subscriptionCode })
      .execute();
  }
}
