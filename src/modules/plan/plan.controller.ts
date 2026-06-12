import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PlanService } from './plan.service';
import { InitiateUpgradeDto } from './dto/initiate-upgrade.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseUtil } from '../../utils/response.util';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async getAllPlans() {
    const plans = await this.planService.getAllPlans();
    return ResponseUtil.success(plans);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentPlan(@CurrentUser() user: any) {
    const data = await this.planService.getCurrentPlan(user.id);
    return ResponseUtil.success(data);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  async initiateUpgrade(@CurrentUser() user: any, @Body() upgradeDto: InitiateUpgradeDto) {
    const data = await this.planService.initiateUpgrade(user.id, upgradeDto.plan);
    return ResponseUtil.success(data, 'Payment session created');
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@CurrentUser() user: any) {
    await this.planService.cancelSubscription(user.id);
    return ResponseUtil.success(null, 'Subscription cancelled successfully');
  }

  /**
   * Paystack webhook — no auth guard, Paystack signature verification is done
   * inside the service via the x-paystack-signature header.
   */
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: { event: string; data: Record<string, any> },
  ) {
    await this.planService.handleWebhook(body.event, body.data);
    return { received: true };
  }
}
