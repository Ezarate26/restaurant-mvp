import type { BusinessMode } from '@/lib/model/types';

export function businessModeLabel(mode: BusinessMode | null | undefined): string {
  switch (mode) {
    case 'multi_table':
      return 'Mesas (multi-mesa)';
    case 'single_point':
      return 'Mostrador / punto único';
    case 'hybrid':
      return 'Híbrido (mesas + mostrador)';
    default:
      return mode ?? '—';
  }
}
