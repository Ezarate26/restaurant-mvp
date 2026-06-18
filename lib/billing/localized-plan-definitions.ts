import { PLAN_DEFINITIONS } from '@/lib/billing/constants';
import type { PlanDefinition } from '@/lib/billing/types';
import type { AppLang } from '@/lib/i18n/lang';
import { MESSAGES } from '@/lib/i18n/messages';

/** Planes con textos de marketing según idioma del landing. */
export function getLocalizedPlanDefinitions(lang: AppLang): PlanDefinition[] {
  const copy = MESSAGES[lang].landing.plans;

  return PLAN_DEFINITIONS.map((plan) => {
    const localized = copy[plan.id];
    return {
      ...plan,
      name: localized.name,
      cta: localized.cta,
      features: [...localized.features],
    };
  });
}

export function getPlanCardCopy(lang: AppLang) {
  return MESSAGES[lang].landing.planCard;
}
