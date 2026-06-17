import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../supabase/supabase.service';
import { BillingService } from './billing.service';
import type { UserBillingSnapshot } from './billing.types';

/**
 * Fuente de verdad del plan del usuario.
 * Equivale a GET /api/user/billing del frontend actual.
 */
@Controller('user/billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  async getState(
    @CurrentUser() user: AuthenticatedUser,
    @Query('conversationId') conversationId?: string,
    @Query('room') room?: string
  ): Promise<UserBillingSnapshot> {
    return this.billing.getUserBillingState(
      user.id,
      conversationId ?? room ?? null
    );
  }
}
