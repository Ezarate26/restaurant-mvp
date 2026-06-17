import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Acceso tipado a variables de entorno. Todas son privadas (solo servidor).
 * Las claves de Stripe son opcionales en arranque: se valida al usarlas
 * (mismo comportamiento que el frontend actual: 503 si no está configurado).
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  private required(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`Variable de entorno requerida ausente: ${key}`);
    }
    return value;
  }

  private optional(key: string): string | undefined {
    return this.config.get<string>(key) || undefined;
  }

  get port(): number {
    return Number(this.config.get<string>('PORT') ?? 4000);
  }

  get corsOrigins(): string[] {
    const raw = this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
    return raw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  get appUrlBase(): string {
    return (this.config.get<string>('APP_URL') ?? 'http://localhost:3000').replace(
      /\/$/,
      ''
    );
  }

  appUrl(path = ''): string {
    const base = this.appUrlBase;
    if (!path) return base;
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  get supabaseUrl(): string {
    return this.required('SUPABASE_URL');
  }

  get supabaseAnonKey(): string {
    return this.required('SUPABASE_ANON_KEY');
  }

  get supabaseServiceRoleKey(): string {
    return this.required('SUPABASE_SERVICE_ROLE_KEY');
  }

  get stripeSecretKey(): string | undefined {
    return this.optional('STRIPE_SECRET_KEY');
  }

  get isStripeConfigured(): boolean {
    return Boolean(this.stripeSecretKey);
  }

  get stripeWebhookSecret(): string | undefined {
    return this.optional('STRIPE_WEBHOOK_SECRET');
  }

  get stripePriceProMonthly(): string {
    return this.required('STRIPE_PRICE_PRO_MONTHLY');
  }

  get stripePriceRoomPass(): string {
    return this.required('STRIPE_PRICE_ROOM_PASS');
  }

  get stripeRoomPassPriceIdOptional(): string | undefined {
    return this.optional('STRIPE_PRICE_ROOM_PASS');
  }

  get stripeTrialDays(): number {
    return Number(this.config.get<string>('STRIPE_TRIAL_DAYS') ?? 0);
  }
}
