import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../supabase/supabase.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateRoomSessionDto } from './dto/create-room-session.dto';
import { StripeClient } from './stripe.client';
import { StripeService } from './stripe.service';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripe: StripeClient,
    private readonly stripeService: StripeService,
    private readonly webhook: StripeWebhookService
  ) {}

  private assertConfigured() {
    if (!this.stripe.isConfigured) {
      throw new ServiceUnavailableException(
        'STRIPE_SECRET_KEY no configurada. Ver .env.example'
      );
    }
  }

  @Post('checkout-session')
  @UseGuards(SupabaseAuthGuard)
  async createCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCheckoutDto
  ): Promise<{ url: string | null }> {
    this.assertConfigured();
    return this.stripeService.createProCheckout(user.id, body.returnUrl);
  }

  @Post('room-session')
  @UseGuards(SupabaseAuthGuard)
  async createRoomSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateRoomSessionDto
  ): Promise<{ url: string | null }> {
    this.assertConfigured();
    return this.stripeService.createRoomCheckout(
      user.id,
      body.conversationId,
      body.returnUrl
    );
  }

  @Post('portal')
  @UseGuards(SupabaseAuthGuard)
  async createPortal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCheckoutDto
  ): Promise<{ url: string }> {
    this.assertConfigured();
    return this.stripeService.createPortalSession(user.id, body.returnUrl);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string
  ): Promise<{ received: boolean }> {
    const rawBody = req.rawBody ?? Buffer.from('');
    return this.webhook.handleEvent(rawBody, signature);
  }
}
