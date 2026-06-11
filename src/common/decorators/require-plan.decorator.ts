import { SetMetadata } from '@nestjs/common';
import { REQUIRE_PLAN_KEY } from '../constants';

export const RequirePlan = (plan: string) => SetMetadata(REQUIRE_PLAN_KEY, plan);
