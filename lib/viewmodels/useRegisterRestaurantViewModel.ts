'use client';

import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { PendingOwnerRestaurantPayload } from '@/lib/auth/pending-registration.storage';
import {
  savePendingOwnerRestaurant,
  savePendingVerifyCredentials,
  clearPendingOwnerRestaurant,
  clearPendingVerifyCredentials,
} from '@/lib/auth/pending-registration.storage';
import type { BusinessMode } from '@/lib/model/types';
import { normalizeAppLanguage } from '@/lib/model/language-options';
import {
  finalizePendingRegistration,
  precheckOwnerSignupEmail,
} from '@/lib/auth/finalize-pending-registration';

export type WizardStep = 1 | 2 | 3;

export interface BasicInfoState {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  defaultLanguage: string;
}

export interface AddressState {
  address: string;
}

export interface BusinessModeState {
  mode: BusinessMode;
  tablesCount: number;
}

/** @deprecated Conservado por StepSuccess / referencias; el wizard ya no lo usa en el flujo principal. */
export interface WizardResult {
  restaurantId: string;
  inviteCode: string;
  email: string;
  inviteEmailSent: boolean;
  inviteEmailError?: string;
}

const MIN_PASSWORD_LEN = 6;

function isDuplicateAuthSignupMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('already registered') ||
    m.includes('already been registered') ||
    m.includes('user already exists')
  );
}

export function useRegisterRestaurantViewModel() {
  const [step, setStep] = useState<WizardStep>(1);

  const [basics, setBasics] = useState<BasicInfoState>({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    defaultLanguage: 'es',
  });

  const [addressState, setAddressState] = useState<AddressState>({
    address: '',
  });

  const [businessState, setBusinessState] = useState<BusinessModeState>({
    mode: 'multi_table',
    tablesCount: 4,
  });

  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerConfirmPassword, setOwnerConfirmPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showOwnerConfirmPassword, setShowOwnerConfirmPassword] =
    useState(false);

  const [ownerSubmitting, setOwnerSubmitting] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  const passwordMismatch =
    ownerConfirmPassword.length > 0 &&
    ownerPassword !== ownerConfirmPassword;

  const canAdvanceFromStep1 = useMemo(() => {
    return (
      basics.name.trim().length > 0 &&
      basics.ownerName.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(basics.email) &&
      basics.phone.trim().length > 0 &&
      ownerPassword.length >= MIN_PASSWORD_LEN &&
      ownerPassword === ownerConfirmPassword
    );
  }, [basics, ownerPassword, ownerConfirmPassword]);

  const canAdvanceFromStep2 = useMemo(
    () => addressState.address.trim().length > 0,
    [addressState]
  );

  const canSubmitBusinessStep = useMemo(() => {
    if (
      businessState.mode === 'multi_table' ||
      businessState.mode === 'hybrid'
    ) {
      return businessState.tablesCount >= 1 && businessState.tablesCount <= 200;
    }
    return true;
  }, [businessState]);

  const canSubmitRegistration = useMemo(
    () =>
      canAdvanceFromStep1 &&
      canAdvanceFromStep2 &&
      canSubmitBusinessStep,
    [canAdvanceFromStep1, canAdvanceFromStep2, canSubmitBusinessStep]
  );

  const buildRestaurantDraft = useCallback((): PendingOwnerRestaurantPayload => {
    return {
      basics: {
        name: basics.name.trim(),
        owner_name: basics.ownerName.trim(),
        email: basics.email.trim(),
        phone: basics.phone.trim(),
      },
      address: addressState.address.trim(),
      businessMode: businessState.mode,
      tablesCount:
        businessState.mode === 'single_point'
          ? undefined
          : businessState.tablesCount,
      defaultLanguage: normalizeAppLanguage(basics.defaultLanguage),
    };
  }, [basics, addressState, businessState]);

  const goNext = useCallback(() => {
    setOwnerError(null);
    setStep((s) => {
      if (s === 1 && !canAdvanceFromStep1) return s;
      if (s === 2 && !canAdvanceFromStep2) return s;
      if (s === 3) return s;
      return (s + 1) as WizardStep;
    });
  }, [canAdvanceFromStep1, canAdvanceFromStep2]);

  const goBack = useCallback(() => {
    setOwnerError(null);
    setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s));
  }, []);

  const submitRegistration =
    useCallback(async (): Promise<{ ok: boolean; skipVerify?: boolean }> => {
      if (!canSubmitRegistration || ownerSubmitting) {
        return { ok: false };
      }
      setOwnerSubmitting(true);
      setOwnerError(null);
      const email = basics.email.trim();
      const pwd = ownerPassword;

      try {
        const pre = await precheckOwnerSignupEmail(supabase, email);
        if (!pre.ok) {
          setOwnerError(pre.message);
          return { ok: false };
        }

        const draft = buildRestaurantDraft();

        const { data: signUpData, error: signUpErr } =
          await supabase.auth.signUp({
            email,
            password: pwd,
            options: {
              data: {
                role: 'owner',
                phone: basics.phone.trim(),
              },
            },
          });

        if (signUpErr || !signUpData.user) {
          const msg =
            signUpErr?.message ?? 'No se pudo crear la cuenta.';
          if (isDuplicateAuthSignupMessage(msg)) {
            setOwnerError(
              'Este correo ya está registrado en Auth. Inicia sesión para continuar.'
            );
          } else {
            setOwnerError(msg);
          }
          return { ok: false };
        }

        savePendingOwnerRestaurant(draft);

        const userId = signUpData.user.id;
        const resolvedEmail =
          signUpData.user.email ?? email;

        if (signUpData.session) {
          const fin = await finalizePendingRegistration(
            supabase,
            userId,
            resolvedEmail
          );
          if (!fin.ok) {
            setOwnerError(fin.message);
            return { ok: false };
          }
          return { ok: true, skipVerify: true };
        }

        savePendingVerifyCredentials(email, pwd);
        return { ok: true, skipVerify: false };
      } catch (e) {
        console.error('submitRegistration', e);
        clearPendingOwnerRestaurant();
        clearPendingVerifyCredentials();
        setOwnerError('Error inesperado al crear la cuenta.');
        return { ok: false };
      } finally {
        setOwnerSubmitting(false);
      }
    }, [
      canSubmitRegistration,
      ownerSubmitting,
      basics.email,
      basics.phone,
      ownerPassword,
      buildRestaurantDraft,
    ]);

  return {
    step,
    setStep,
    basics,
    setBasics,
    address: addressState,
    setAddress: setAddressState,
    business: businessState,
    setBusiness: setBusinessState,
    ownerPassword,
    setOwnerPassword,
    ownerConfirmPassword,
    setOwnerConfirmPassword,
    showOwnerPassword,
    setShowOwnerPassword,
    showOwnerConfirmPassword,
    setShowOwnerConfirmPassword,
    passwordMismatch,
    canAdvanceFromStep1,
    canAdvanceFromStep2,
    canSubmitBusinessStep,
    canSubmitRegistration,
    ownerSubmitting,
    ownerError,
    goNext,
    goBack,
    submitRegistration,
  };
}
