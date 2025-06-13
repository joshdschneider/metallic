import { Subscription } from '@metallichq/types';
import { BillingService, ComputerService } from '../services/index.js';
import { ALLOWED_INSTANCE_TYPES, CONCURRENCY_LIMITS, FREE_PLAN_MAX_COMPUTE_HOURS } from '../utils/constants.js';
import { HttpError } from '../utils/error.js';

interface CheckConcurrencyRequest {
  subscriptions: Subscription[];
  organizationId: string;
}

export const checkConcurrency = async ({ subscriptions, organizationId }: CheckConcurrencyRequest): Promise<void> => {
  const plan = BillingService.getPlanFromSubscriptions(subscriptions);
  const concurrencyLimit = CONCURRENCY_LIMITS[plan];
  const count = await ComputerService.countRunningComputers(organizationId);
  if (count >= concurrencyLimit) {
    throw HttpError.paymentRequired('You have reached your concurrency limit; Please upgrade your plan.');
  }
};

interface CheckInstanceTypeRequest {
  subscriptions: Subscription[];
  instanceType: string;
}

export const checkInstanceType = ({ subscriptions, instanceType }: CheckInstanceTypeRequest): void => {
  const plan = BillingService.getPlanFromSubscriptions(subscriptions);
  const allowedInstanceTypes = ALLOWED_INSTANCE_TYPES[plan];
  if (!allowedInstanceTypes.includes(instanceType)) {
    throw HttpError.paymentRequired(`Please upgrade your plan to use instance type "${instanceType}"`);
  }
};

interface CheckAllowedInvitationsRequest {
  subscriptions: Subscription[];
}

export const checkAllowedInvitations = ({ subscriptions }: CheckAllowedInvitationsRequest): void => {
  const plan = BillingService.getPlanFromSubscriptions(subscriptions);
  if (plan === 'free') {
    throw HttpError.paymentRequired('Please upgrade your plan to add team members.');
  }
};

interface CheckMonthlyUsageRequest {
  organizationId: string;
  subscriptions: Subscription[];
}

/**
 * ADD TO CONTROLLER METHODS TO GUARD
 */

export const checkMonthlyUsage = async ({ organizationId, subscriptions }: CheckMonthlyUsageRequest): Promise<void> => {
  const plan = BillingService.getPlanFromSubscriptions(subscriptions);
  if (plan !== 'free') {
    return;
  }

  const computeHoursThisMonth = await BillingService.countComputeHoursThisMonth(organizationId);
  if (computeHoursThisMonth > FREE_PLAN_MAX_COMPUTE_HOURS) {
    throw HttpError.paymentRequired('You have reached your monthly compute usage limit; Please upgrade your plan.');
  }
};
