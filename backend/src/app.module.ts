import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { SupabaseModule } from './supabase/supabase.module';
import { BillingModule } from './billing/billing.module';
import { StripeModule } from './stripe/stripe.module';
import { TranslationModule } from './translation/translation.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { VoiceModule } from './voice/voice.module';
import { HealthModule } from './health/health.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    SupabaseModule,
    BillingModule,
    StripeModule,
    TranslationModule,
    ConversationsModule,
    MessagesModule,
    VoiceModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
