import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';
import { AppConfigService } from '../config/app-config.service';

/** Encapsula la instancia de Stripe y los price IDs (lazy + validación). */
@Injectable()
export class StripeClient {
  private client: Stripe | null = null;

  constructor(private readonly config: AppConfigService) {}

  get isConfigured(): boolean {
    return this.config.isStripeConfigured;
  }

  get instance(): Stripe {
    if (this.client) return this.client;
    const key = this.config.stripeSecretKey;
    if (!key) {
      throw new ServiceUnavailableException('STRIPE_SECRET_KEY no configurada');
    }
    this.client = new Stripe(key);
    return this.client;
  }

  get proPriceId(): string {
    return this.config.stripePriceProMonthly;
  }

  get roomPassPriceId(): string {
    return this.config.stripePriceRoomPass;
  }
}
