import type { PlanDefinition, PlanLimits } from '@/lib/billing/types';

export const PLAN_STORAGE_KEY = 'conversationPlatform.userPlan';
export const ROOM_PASS_STORAGE_KEY = 'conversationPlatform.roomPasses';

export const FREE_LIMITS: PlanLimits = {
  maxParticipants: 2,
  roomDurationMinutes: 5,
  voiceEnabled: false,
  languages: 'es-en',
};

export const PRO_LIMITS: PlanLimits = {
  maxParticipants: 10,
  roomDurationMinutes: 60,
  voiceEnabled: true,
  languages: 'all',
};

/** Bolsa Plan 24 Horas (ms). */
export const HOURS_24_PACK_MS = 24 * 60 * 60 * 1000;

export const ROOM_PASS_DURATION_MINUTES = 60;

/** Período de gracia tras agotar tiempo (Pro / pase por sala). */
export const ROOM_GRACE_PERIOD_MS = 3 * 60_000;

/** Extensión al continuar en Pro. */
export const PRO_ROOM_EXTENSION_MS = 60 * 60_000;

/** Bono único al solicitar más tiempo en Free. */
export const FREE_ROOM_EXTENSION_MS = 10 * 60_000;

/** Máximo de salas nuevas por ventana de 24 h en plan Free. */
export const FREE_DAILY_CONVERSATION_LIMIT = 3;

/** Días de prueba gratuita del plan Pro (debe coincidir con STRIPE_TRIAL_DAYS). */
export const PRO_TRIAL_DAYS = 7;

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
      'Español ↔ Inglés',
      'Hasta 3 chats por día',
      'Hasta 5 minutos por chat',
      'Traducción de texto',
      'Sin registro obligatorio',
    ],
  },
  {
    id: 'room_pass',
    name: 'Plan por sala',
    priceLabel: '$2.99',
    priceAmount: 299,
    currency: 'usd',
    interval: 'one_time',
    cta: 'Comprar pase',
    features: [
      '1 hora de conversación',
      'Todos los idiomas principales desbloqueados',
      'Traducción de voz',
      'Speech-to-Text',
      'Text-to-Speech',
      'Traducción de texto ilimitada durante la sesión',
    ],
  },
  {
    id: 'hours_24',
    name: 'Plan 24 Horas',
    priceLabel: '$4.99',
    priceAmount: 499,
    currency: 'usd',
    interval: 'one_time',
    cta: 'Comprar bolsa',
    features: [
      'Bolsa de 24 horas de conversación',
      'Todos los idiomas principales desbloqueados',
      'Traducción de voz',
      'Speech-to-Text',
      'Text-to-Speech',
      'Mostrar horas restantes en todo momento',
      'Consumir horas únicamente durante sesiones activas',
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
    cta: 'Probar 7 días gratis',
    features: [
      'Horas ilimitadas',
      'Todos los idiomas principales desbloqueados',
      'Traducción de voz',
      'Speech-to-Text',
      'Text-to-Speech',
      'Historial de conversaciones',
      'Funcionalidades premium futuras',
    ],
  },
];

export const FREE_LANGUAGE_CODES = new Set(['es', 'en']);
