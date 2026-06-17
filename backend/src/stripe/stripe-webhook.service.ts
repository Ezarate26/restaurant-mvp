import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type Stripe from 'stripe';
import { BillingRepository } from '../billing/billing.repository';
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  ROOM_PASS_DURATION_MINUTES,
} from '../billing/billing.constants';
import { AppConfigService } from '../config/app-config.service';
import { StripeClient } from './stripe.client';
import { StripeTrialService } from './stripe-trial.service';

type CheckoutContext = {
  userId: string;
  conversationId?: string;
};

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly stripe: StripeClient,
    private readonly billing: BillingRepository,
    private readonly trial: StripeTrialService,
    private readonly config: AppConfigService
  ) {}

  /** Verifica la firma y despacha el evento. */
  async handleEvent(rawBody: Buffer | string, signature: string | undefined) {
    const webhookSecret = this.config.stripeWebhookSecret;
    if (!webhookSecret) {
      throw new ServiceUnavailableException('STRIPE_WEBHOOK_SECRET no configurado');
    }
    if (!signature) {
      throw new BadRequestException('Firma ausente');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.instance.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (e) {
      this.logger.error(`webhook signature: ${(e as Error).message}`);
      throw new BadRequestException('Firma inválida');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        if (customer.id) {
          await this.trial.syncTrialUsedFromCustomerId(customer.id);
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  private subscriptionPeriodEndIso(
    subscription: Stripe.Subscription
  ): string | null {
    const end = (subscription as unknown as { current_period_end?: number })
      .current_period_end;
    if (typeof end !== 'number') return null;
    return new Date(end * 1000).toISOString();
  }

  private parseClientReferenceId(ref: string): CheckoutContext | null {
    const [userId, conversationId] = ref.split(':');
    if (!userId) return null;
    return { userId, conversationId: conversationId || undefined };
  }

  private async resolveCheckoutContext(
    session: Stripe.Checkout.Session
  ): Promise<CheckoutContext | null> {
    if (session.metadata?.userId) {
      return {
        userId: session.metadata.userId,
        conversationId: session.metadata.conversationId,
      };
    }

    if (session.client_reference_id) {
      const parsed = this.parseClientReferenceId(session.client_reference_id);
      if (parsed) return parsed;
    }

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    if (customerId) {
      const billing = await this.billing.fetchUserBillingByCustomerId(customerId);
      if (billing) return { userId: billing.user_id };
    }

    const email =
      session.customer_details?.email ??
      (typeof session.customer_email === 'string'
        ? session.customer_email
        : null);

    if (email) {
      const userId = await this.billing.fetchUserIdByEmail(email);
      if (userId) return { userId };
    }

    return null;
  }

  private async sessionIncludesRoomPassPrice(
    session: Stripe.Checkout.Session
  ): Promise<boolean> {
    const roomPriceId = this.config.stripeRoomPassPriceIdOptional;
    if (!roomPriceId) return false;

    if (session.metadata?.type === 'room_pass') return true;

    const lineItems = await this.stripe.instance.checkout.sessions.listLineItems(
      session.id,
      { limit: 10 }
    );

    return lineItems.data.some((item) => item.price?.id === roomPriceId);
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const ctx = await this.resolveCheckoutContext(session);
    if (!ctx) return;

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    if (session.mode === 'subscription' && session.subscription && customerId) {
      const subId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
      const subscription = (await this.stripe.instance.subscriptions.retrieve(
        subId
      )) as Stripe.Subscription;
      const periodEnd = this.subscriptionPeriodEndIso(subscription);

      await this.billing.activateProSubscription({
        userId: ctx.userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        proExpiresAt: periodEnd,
      });
      await this.trial.syncTrialUsedFromSubscription(ctx.userId, subscription);
      return;
    }

    if (session.mode === 'payment') {
      const isRoomPass =
        session.metadata?.type === 'room_pass' ||
        (await this.sessionIncludesRoomPassPrice(session));

      if (!isRoomPass) return;

      const conversationId =
        ctx.conversationId ?? session.metadata?.conversationId;
      if (!conversationId) {
        this.logger.warn(
          'room_pass checkout sin conversationId — abre billing desde una sala (?room=...)'
        );
        return;
      }

      const minutes =
        Number(session.metadata?.durationMinutes) || ROOM_PASS_DURATION_MINUTES;
      const expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
      await this.billing.insertRoomPass({
        userId: ctx.userId,
        conversationId,
        expiresAt,
        stripeCheckoutSessionId: session.id,
      });
    }
  }

  private async resolveUserIdFromSubscription(
    subscription: Stripe.Subscription
  ): Promise<string | null> {
    if (subscription.metadata?.userId) return subscription.metadata.userId;

    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    const billing = await this.billing.fetchUserBillingByCustomerId(customerId);
    return billing?.user_id ?? null;
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = await this.resolveUserIdFromSubscription(subscription);
    if (!userId) return;

    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    const active = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
    const periodEnd = this.subscriptionPeriodEndIso(subscription);

    if (active) {
      await this.billing.activateProSubscription({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        proExpiresAt: periodEnd,
      });
      await this.trial.syncTrialUsedFromSubscription(userId, subscription);
    } else {
      await this.billing.downgradeToFree(userId, subscription.status);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = await this.resolveUserIdFromSubscription(subscription);
    if (!userId) return;
    await this.billing.downgradeToFree(userId, 'canceled');
  }
}
