import type { AppLang } from './lang';
import type { AppMessages } from './messages';

/** @deprecated Usar `MESSAGES` desde `./messages` y `useAppLanguage`. */
export type LandingLang = AppLang;

/** @deprecated Usar `APP_LANG_STORAGE_KEY` desde `./lang`. */
export { APP_LANG_STORAGE_KEY as LANDING_LANG_STORAGE_KEY } from './lang';

/** @deprecated Usar `AppMessages['landing']`. */
export type LandingCopy = AppMessages['landing'];

/** @deprecated Usar `MESSAGES[lang].landing`. */
export { MESSAGES } from './messages';

import { MESSAGES } from './messages';
export const LANDING_COPY: Record<AppLang, AppMessages['landing']> = {
  es: MESSAGES.es.landing,
  en: MESSAGES.en.landing,
};
