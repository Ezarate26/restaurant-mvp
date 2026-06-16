export const THEME_STORAGE_KEY = 'conversationPlatform.theme';

export type ThemeId = 'nebula-dark' | 'nebula-light';

export const DEFAULT_THEME: ThemeId = 'nebula-dark';

export const THEMES: Record<
  ThemeId,
  { id: ThemeId; label: string; description: string }
> = {
  'nebula-dark': {
    id: 'nebula-dark',
    label: 'Nebula Dark',
    description: 'Oscuro con acentos morados y rosas',
  },
  'nebula-light': {
    id: 'nebula-light',
    label: 'Nebula Light',
    description: 'Claro con la misma identidad de marca',
  },
};

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === 'nebula-dark' || value === 'nebula-light';
}

export function readStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
