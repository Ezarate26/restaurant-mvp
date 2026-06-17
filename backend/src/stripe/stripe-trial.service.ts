import { Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import { BillingRepository } from '../billing/billing.repository';
import { StripeClient } from './stripe.client';

@Injectable()
export class StripeTrialService {
  constructor(
    private readonly stripe: StripeClient,
    private readonly billing: BillingRepository
  ) {}

  /** Stripe: ¿este customer ya tuvo suscripción con trial? */
  async customerHasUsedTrial(customerId: string): Promise<boolean> {
    const subs = await this.stripe.instance.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    });

    return subs.data.some(
      (sub) => sub.trial_start != null || sub.status === 'trialing'
    );
  }

  async resolveTrialEligibility(
    userId: string,
    stripeCustomerId: string | null
  ): Promise<boolean> {
    if (await this.billing.isTrialUsedForUser(userId)) return false;

    if (stripeCustomerId && (await this.customerHasUsedTrial(stripeCustomerId))) {
      await this.billing.markTrialUsed(userId);
      return false;
    }

    return true;
  }

  async syncTrialUsedFromSubscription(
    userId: string,
    subscription: Stripe.Subscription
  ): Promise<void> {
    if (subscription.trial_start != null || subscription.status === 'trialing') {
      await this.billing.markTrialUsed(userId);
    }
  }

  async syncTrialUsedFromCustomerId(customerId: string): Promise<void> {
    const billing = await this.billing.fetchUserBillingByCustomerId(customerId);
    if (!billing || billing.trial_used_at) return;

    if (await this.customerHasUsedTrial(customerId)) {
      await this.billing.markTrialUsed(billing.user_id);
    }
  }
}
