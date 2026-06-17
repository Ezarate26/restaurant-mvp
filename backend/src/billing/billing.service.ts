import { Injectable } from '@nestjs/common';
import { BillingRepository } from './billing.repository';
import { EMPTY_BILLING_SNAPSHOT, type UserBillingSnapshot } from './billing.types';

@Injectable()
export class BillingService {
  constructor(private readonly repo: BillingRepository) {}

  async getUserBillingState(
    userId: string | null,
    conversationId?: string | null
  ): Promise<UserBillingSnapshot> {
    if (!userId) {
      return { ...EMPTY_BILLING_SNAPSHOT };
    }

    const billing = await this.repo.getOrCreateBillingRow(userId);
    const tier = this.repo.resolveEffectiveTier(billing);
    const activeRoomPasses = await this.repo.fetchActiveRoomPassesForUser(userId);

    let roomPassActive = false;
    let roomPassExpiresAt: string | null = null;
    let roomPassConversationId: string | null = null;

    if (conversationId) {
      const pass = await this.repo.fetchActiveRoomPassForConversation(
        conversationId
      );
      if (pass) {
        roomPassActive = true;
        roomPassExpiresAt = pass.expires_at;
        roomPassConversationId = pass.conversation_id;
      }
    } else if (activeRoomPasses.length > 0) {
      const latest = activeRoomPasses[0];
      roomPassActive = true;
      roomPassExpiresAt = latest.expiresAt;
      roomPassConversationId = latest.conversationId;
    }

    return {
      tier,
      isAuthenticated: true,
      subscriptionStatus: billing?.subscription_status ?? null,
      proExpiresAt: billing?.pro_expires_at ?? null,
      stripeCustomerId: billing?.stripe_customer_id ?? null,
      trialUsed: Boolean(billing?.trial_used_at),
      trialUsedAt: billing?.trial_used_at ?? null,
      roomPassActive,
      roomPassExpiresAt,
      roomPassConversationId,
      activeRoomPasses,
    };
  }
}
