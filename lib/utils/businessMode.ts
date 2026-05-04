import type {
  BusinessMode,
  ServicePointModeOverride,
} from '@/lib/model/types';

export type EffectiveMode = 'multi' | 'single';

/**
 * Resuelve el modo efectivo de un service_point: mode_override gana sobre business_mode.
 * - 'multi'  → varias sesiones / mesas separadas (caso clásico restaurante).
 * - 'single' → un único punto, varios session_users (mostrador / barra).
 */
export function resolveEffectiveMode(
  restaurantBusinessMode: BusinessMode | null | undefined,
  pointModeOverride: ServicePointModeOverride | null | undefined
): EffectiveMode {
  if (pointModeOverride === 'multi') return 'multi';
  if (pointModeOverride === 'single') return 'single';

  switch (restaurantBusinessMode) {
    case 'single_point':
      return 'single';
    case 'multi_table':
    case 'hybrid':
    default:
      return 'multi';
  }
}
