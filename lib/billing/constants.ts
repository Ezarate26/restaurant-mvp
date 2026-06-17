import type { PlanDefinition, PlanLimits } from '@/lib/billing/types';

export const PLAN_STORAGE_KEY = 'conversationPlatform.userPlan';
export const ROOM_PASS_STORAGE_KEY = 'conversationPlatform.roomPasses';

export const FREE_LIMITS: PlanLimits = {
  maxParticipants: 2,
  roomDurationMinutes: 10,
  voiceEnabled: false,
  languages: 'es-en',
};

export const PRO_LIMITS: PlanLimits = {
  maxParticipants: 10,
  roomDurationMinutes: 60,
  voiceEnabled: true,
  languages: 'all',
};

export const ROOM_PASS_DURATION_MINUTES = 60;

/** Período de gracia tras agotar tiempo (Pro / pase por sala). */
export const ROOM_GRACE_PERIOD_MS = 3 * 60_000;

/** Extensión al continuar en Pro. */
export const PRO_ROOM_EXTENSION_MS = 60 * 60_000;

/** Bono único al solicitar más tiempo en Free. */
export const FREE_ROOM_EXTENSION_MS = 10 * 60_000;

/** Máximo de salas nuevas por ventana de 24 h en plan Free. */
export const FREE_DAILY_CONVERSATION_LIMIT = 5;

/** Ventana rodante desde la primera charla del período. */
export const FREE_DAILY_WINDOW_MS = 24 * 60 * 60_000;

/** Todos los precios de pago en USD */
export const BILLING_CURRENCY = 'usd' as const;

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    cta: 'Probar gratis',
    features: [
      'Solo mensajes de texto',
      'Español ↔ Inglés',
      'Hasta 2 participantes por sala',
      'Sala activa 10 minutos',
      'Hasta 5 conversaciones nuevas cada 24 h',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$9.99',
    priceAmount: 999,
    currency: 'usd',
    interval: 'monthly',
    highlighted: true,
    cta: 'Suscribirse a Pro',
    features: [
      'Todos los idiomas',
      'Mensajes de voz con traducción',
      'Hasta 10 participantes',
      'Sala activa 60 minutos',
      'Facturación recurrente mensual',
    ],
  },
  {
    id: 'room_pass',
    name: 'Pase por sala',
    priceLabel: '$2.99',
    priceAmount: 299,
    currency: 'usd',
    interval: 'one_time',
    cta: 'Comprar pase',
    features: [
      'Características Pro por 60 min',
      'Pago único por sala',
      'Ideal para reuniones puntuales',
      'Sin suscripción',
    ],
  },
];

export const FREE_LANGUAGE_CODES = new Set(['es', 'en']);
