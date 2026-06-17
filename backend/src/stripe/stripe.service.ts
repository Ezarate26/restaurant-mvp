import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { BillingRepository } from '../billing/billing.repository';
import { ROOM_PASS_DURATION_MINUTES } from '../billing/billing.constants';
import { AppConfigService } from '../config/app-config.service';
import { SupabaseService } from '../supabase/supabase.service';
import { StripeClient } from './stripe.client';
import { StripeTrialService } from './stripe-trial.service';

@Injectable()
export class StripeService {
  constructor(
    private readonly stripe: StripeClient,
    private readonly billing: BillingRepository,
    private readonly trial: StripeTrialService,
    private readonly supabase: SupabaseService,
    private readonly config: AppConfigService
  ) {}

  /** Garantiza un customer de Stripe asociado al usuario. */
  private async ensureCustomerId(userId: string): Promise<string> {
    const billing = await this.billing.getOrCreateBillingRow(userId);
    if (!billing) {
      throw new InternalServerErrorException('No se pudo cargar billing');
    }

    if (billing.stripe_customer_id) return billing.stripe_customer_id;

    const email = await this.supabase.getUserEmail(userId);
    const customer = await this.stripe.instance.customers.create({
      email: email ?? undefined,
      metadata: { userId },
    });
    await this.billing.ensureStripeCustomer(userId, email, customer.id);
    return customer.id;
  }

  /** Checkout de suscripción Pro (con trial si aplica). */
  async createProCheckout(
    userId: string,
    returnUrl?: string
  ): Promise<{ url: string | null }> {
    const returnPath = returnUrl ?? '/app/billing';
    const customerId = await this.ensureCustomerId(userId);

    const trialEligible = await this.trial.resolveTrialEligibility(
      userId,
      customerId
    );
    const trialDays = this.config.stripeTrialDays;

    const subscriptionData: {
      metadata: { userId: string };
      trial_period_days?: number;
    } = { metadata: { userId } };

    if (trialEligible && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    const session = await this.stripe.instance.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: this.stripe.proPriceId, quantity: 1 }],
      success_url: `${this.config.appUrl(returnPath)}?checkout=success`,
      cancel_url: `${this.config.appUrl(returnPath)}?checkout=cancel`,
      metadata: { userId, type: 'pro_subscription' },
      subscription_data: subscriptionData,
    });

    return { url: session.url };
  }

  /** Checkout de pago único para un Room Pass. */
  async createRoomCheckout(
    userId: string,
    conversationId: string,
    returnUrl?: string
  ): Promise<{ url: string | null }> {
    const returnPath = returnUrl ?? `/c/${conversationId}`;
    const customerId = await this.ensureCustomerId(userId);

    const session = await this.stripe.instance.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price: this.stripe.roomPassPriceId, quantity: 1 }],
      success_url: `${this.config.appUrl(returnPath)}?room_pass=success`,
      cancel_url: `${this.config.appUrl(returnPath)}?room_pass=cancel`,
      metadata: {
        userId,
        type: 'room_pass',
        conversationId,
        durationMinutes: String(ROOM_PASS_DURATION_MINUTES),
      },
    });

    return { url: session.url };
  }

  /** Portal de cliente de Stripe. */
  async createPortalSession(
    userId: string,
    returnUrl?: string
  ): Promise<{ url: string }> {
    const returnPath = returnUrl ?? '/app/billing';
    const billing = await this.billing.fetchUserBilling(userId);

    if (!billing?.stripe_customer_id) {
      throw new BadRequestException(
        'Aún no tienes un cliente de Stripe asociado'
      );
    }

    const portal = await this.stripe.instance.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: this.config.appUrl(returnPath),
    });

    return { url: portal.url };
  }
}
