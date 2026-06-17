import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { StripeClient } from './stripe.client';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeTrialService } from './stripe-trial.service';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [BillingModule],
  controllers: [StripeController],
  providers: [
    StripeClient,
    StripeService,
    StripeTrialService,
    StripeWebhookService,
  ],
  exports: [StripeService],
})
export class StripeModule {}
