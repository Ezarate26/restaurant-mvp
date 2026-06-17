import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ACTIVE_SUBSCRIPTION_STATUSES } from './billing.constants';
import type {
  ActiveRoomPassInfo,
  PlanTier,
  RoomPassRow,
  UserBillingRow,
} from './billing.types';

@Injectable()
export class BillingRepository {
  private readonly logger = new Logger(BillingRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.serviceRole();
  }

  async fetchUserBilling(userId: string): Promise<UserBillingRow | null> {
    const { data, error } = await this.db
      .from('user_billing')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`fetchUserBilling: ${error.message}`);
      return null;
    }
    return data as UserBillingRow | null;
  }

  async fetchUserBillingByCustomerId(
    stripeCustomerId: string
  ): Promise<UserBillingRow | null> {
    const { data, error } = await this.db
      .from('user_billing')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();

    if (error) {
      this.logger.error(`fetchUserBillingByCustomerId: ${error.message}`);
      return null;
    }
    return data as UserBillingRow | null;
  }

  async fetchUserIdByEmail(email: string): Promise<string | null> {
    const { data, error } = await this.db
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      this.logger.error(`fetchUserIdByEmail: ${error.message}`);
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  }

  async ensureStripeCustomer(
    userId: string,
    _email: string | null,
    stripeCustomerId: string
  ): Promise<void> {
    const { error } = await this.db.from('user_billing').upsert(
      {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        plan_tier: 'free',
      },
      { onConflict: 'user_id' }
    );
    if (error) this.logger.error(`ensureStripeCustomer: ${error.message}`);
  }

  async getOrCreateBillingRow(userId: string): Promise<UserBillingRow | null> {
    const existing = await this.fetchUserBilling(userId);
    if (existing) return existing;

    const { data, error } = await this.db
      .from('user_billing')
      .insert({ user_id: userId, plan_tier: 'free' })
      .select('*')
      .single();

    if (error) {
      this.logger.error(`getOrCreateBillingRow: ${error.message}`);
      return null;
    }
    return data as UserBillingRow;
  }

  async activateProSubscription(params: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    subscriptionStatus: string;
    proExpiresAt: string | null;
  }): Promise<void> {
    const { error } = await this.db.from('user_billing').upsert(
      {
        user_id: params.userId,
        stripe_customer_id: params.stripeCustomerId,
        stripe_subscription_id: params.stripeSubscriptionId,
        subscription_status: params.subscriptionStatus,
        plan_tier: 'pro',
        pro_expires_at: params.proExpiresAt,
      },
      { onConflict: 'user_id' }
    );
    if (error) this.logger.error(`activateProSubscription: ${error.message}`);
  }

  async downgradeToFree(
    userId: string,
    subscriptionStatus: string
  ): Promise<void> {
    const { error } = await this.db
      .from('user_billing')
      .update({
        plan_tier: 'free',
        subscription_status: subscriptionStatus,
        pro_expires_at: null,
        stripe_subscription_id: null,
      })
      .eq('user_id', userId);
    if (error) this.logger.error(`downgradeToFree: ${error.message}`);
  }

  async insertRoomPass(params: {
    userId: string;
    conversationId: string;
    expiresAt: string;
    stripeCheckoutSessionId?: string;
  }): Promise<void> {
    const { error } = await this.db.from('room_passes').insert({
      user_id: params.userId,
      conversation_id: params.conversationId,
      expires_at: params.expiresAt,
      stripe_checkout_session_id: params.stripeCheckoutSessionId ?? null,
    });
    if (error) this.logger.error(`insertRoomPass: ${error.message}`);
  }

  async fetchActiveRoomPassForConversation(
    conversationId: string
  ): Promise<RoomPassRow | null> {
    const { data, error } = await this.db
      .from('room_passes')
      .select('*')
      .eq('conversation_id', conversationId)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.error(`fetchActiveRoomPassForConversation: ${error.message}`);
      return null;
    }
    return data as RoomPassRow | null;
  }

  async fetchActiveRoomPassesForUser(
    userId: string
  ): Promise<ActiveRoomPassInfo[]> {
    const { data, error } = await this.db
      .from('room_passes')
      .select('conversation_id, expires_at, purchased_at')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) {
      this.logger.error(`fetchActiveRoomPassesForUser: ${error.message}`);
      return [];
    }

    return (data ?? []).map((row) => ({
      conversationId: row.conversation_id as string,
      expiresAt: row.expires_at as string,
      purchasedAt: row.purchased_at as string,
    }));
  }

  async markTrialUsed(userId: string): Promise<void> {
    const { error } = await this.db
      .from('user_billing')
      .update({ trial_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('trial_used_at', null);

    if (error) this.logger.error(`markTrialUsed: ${error.message}`);
  }

  async isTrialUsedForUser(userId: string): Promise<boolean> {
    const billing = await this.fetchUserBilling(userId);
    return Boolean(billing?.trial_used_at);
  }

  resolveEffectiveTier(billing: UserBillingRow | null): PlanTier {
    if (!billing || billing.plan_tier !== 'pro') return 'free';
    if (
      billing.pro_expires_at &&
      Date.parse(billing.pro_expires_at) <= Date.now()
    ) {
      return 'free';
    }
    if (
      billing.stripe_subscription_id &&
      billing.subscription_status &&
      !ACTIVE_SUBSCRIPTION_STATUSES.has(billing.subscription_status)
    ) {
      return 'free';
    }
    return 'pro';
  }
}
