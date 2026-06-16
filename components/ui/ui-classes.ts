/** Design system Conversa — Nebula themes */

const touchBtn =
  'app-touchable touch-target inline-flex min-h-[44px] items-center justify-center';

export const uiInput =
  'w-full rounded-xl border border-[var(--form-border)] bg-[var(--form-bg)] px-3.5 py-3 text-base text-[var(--form-text)] placeholder:text-[var(--form-placeholder)] outline-none transition duration-200 focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[15px] sm:py-2.5';

export const uiSelect = `${uiInput} cursor-pointer`;

export const uiSelectGlass =
  'nebula-glass app-touchable w-full min-h-[44px] cursor-pointer rounded-xl border-0 px-3.5 py-3 text-base text-[var(--app-text)] outline-none transition duration-200 focus:ring-2 focus:ring-[var(--app-primary)]/25 sm:text-[15px] sm:py-2.5';

export const uiLabel =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]';

export const uiCard =
  'rounded-2xl border border-[var(--form-border)] bg-[var(--form-bg)] p-4 text-[var(--form-text)] shadow-lg sm:p-6 md:p-8';

export const uiError =
  'rounded-xl border border-[var(--app-danger)]/40 bg-[var(--app-danger)]/10 px-3 py-2 text-sm text-[var(--app-danger)]';

export const uiSuccess = 'text-sm font-medium text-[var(--app-success)]';

export const uiBtnPrimary = `${touchBtn} app-hover btn-gradient w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200`;

export const uiBtnSecondary = `${touchBtn} app-hover w-full rounded-xl border border-[var(--form-border)] bg-[var(--app-card)] px-4 py-2.5 text-sm font-semibold text-[var(--app-text)] transition duration-200 hover:bg-[var(--app-hover-bg)] disabled:opacity-50`;

export const uiBtnGhost =
  'app-touchable app-hover inline-flex min-h-[44px] items-center text-sm font-medium text-[var(--app-primary)] transition duration-200 hover:text-[var(--app-accent)]';

export const uiModalPanel =
  'nebula-glass modal-panel-scroll w-full max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto rounded-2xl p-4 shadow-2xl sm:p-6';

export const uiModalTitle = 'text-lg font-bold text-[var(--modal-text)]';

export const uiModalText =
  'mt-3 text-sm leading-relaxed text-[var(--modal-muted)]';

export const uiModalBtnCancel = `${touchBtn} app-hover rounded-xl border border-[var(--modal-border)] bg-[var(--app-card)] px-4 py-2.5 text-sm font-medium text-[var(--modal-text)] transition duration-200 hover:bg-[var(--app-hover-bg)] disabled:opacity-50`;

export const uiModalBtnConfirm = `${touchBtn} app-hover btn-gradient rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50`;

export const uiModalBtnDanger = `${touchBtn} app-hover rounded-xl bg-[var(--app-danger)] px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:brightness-110 disabled:opacity-50`;

export const uiIconBtn =
  'app-touchable touch-target inline-flex items-center justify-center rounded-xl p-2.5 text-[var(--app-muted)] transition duration-200 hover:bg-[var(--app-hover-bg)] hover:text-[var(--app-text)] disabled:opacity-40';

export const uiNavItem =
  'app-touchable app-hover flex min-h-[44px] w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-[var(--app-muted)] hover:bg-[var(--app-hover-bg)] hover:text-[var(--app-text)]';
