/** Landing público */
export const LANDING_PATH = '/';

/** Vista principal para usuarios autenticados (post login/registro) */
export const AUTH_HOME_PATH = '/app/home';

export const AUTH_ENTRY_PATHS = [
  '/login',
  '/register',
  '/auth/login',
  '/auth/register',
] as const;
