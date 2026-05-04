'use client';

import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createRestaurantWithSettingsAndPoints } from '@/lib/model/restaurants.repository';
import { insertWaiterProfile } from '@/lib/model/profiles.repository';
import type { BusinessMode } from '@/lib/model/types';

export type WizardStep = 1 | 2 | 3 | 4;

export interface BasicInfoState {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
}

export interface AddressState {
  address: string;
}

export interface BusinessModeState {
  mode: BusinessMode;
  tablesCount: number;
}

export interface WizardResult {
  restaurantId: string;
  inviteCode: string;
  /** Email del propietario al que se envió el código (eco para UI). */
  email: string;
  /** Estado del envío del email; el wizard NO falla si esto es false. */
  inviteEmailSent: boolean;
  inviteEmailError?: string;
}

const MIN_PASSWORD_LEN = 6;

export function useRegisterRestaurantViewModel() {
  const [step, setStep] = useState<WizardStep>(1);

  const [basics, setBasics] = useState<BasicInfoState>({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WizardResult | null>(null);

  const [ownerSubmitting, setOwnerSubmitting] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  const canAdvanceFromStep1 = useMemo(() => {
    return (
      basics.name.trim().length > 0 &&
      basics.ownerName.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(basics.email) &&
      basics.phone.trim().length > 0
    );
  }, [basics]);

  const canAdvanceFromStep2 = useMemo(
    () => addressState.address.trim().length > 0,
    [addressState]
  );

  const canSubmit = useMemo(() => {
    if (
      businessState.mode === 'multi_table' ||
      businessState.mode === 'hybrid'
    ) {
      return businessState.tablesCount >= 1 && businessState.tablesCount <= 200;
    }
    return true;
  }, [businessState]);

  const canSubmitOwnerAccount = useMemo(() => {
    if (ownerPassword.length < MIN_PASSWORD_LEN) return false;
    if (ownerPassword !== ownerConfirmPassword) return false;
    return true;
  }, [ownerPassword, ownerConfirmPassword]);

  const goNext = useCallback(() => {
    setError(null);
    setStep((s) => {
      if (s === 1 && !canAdvanceFromStep1) return s;
      if (s === 2 && !canAdvanceFromStep2) return s;
      if (s === 3) return s;
      if (s === 4) return s;
      return (s + 1) as WizardStep;
    });
  }, [canAdvanceFromStep1, canAdvanceFromStep2]);

  const goBack = useCallback(() => {
    setError(null);
    setStep((s) => {
      if (s === 4) return s;
      return s > 1 ? ((s - 1) as WizardStep) : s;
    });
  }, []);

  const submit = useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const out = await createRestaurantWithSettingsAndPoints(supabase, {
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
      });
      setResult({
        restaurantId: out.restaurantId,
        inviteCode: out.inviteCode,
        email: basics.email.trim(),
        inviteEmailSent: out.inviteEmailSent,
        inviteEmailError: out.inviteEmailError,
      });
      setOwnerPassword('');
      setOwnerConfirmPassword('');
      setOwnerError(null);
      setStep(4);
    } catch (e) {
      console.error('useRegisterRestaurantViewModel:submit', e);
      setError('No se pudo crear el restaurante. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, submitting, basics, addressState, businessState]);

  const submitOwnerAccount = useCallback(async (): Promise<{
    ok: boolean;
    needsEmailConfirm?: boolean;
  }> => {
    if (!result || !canSubmitOwnerAccount || ownerSubmitting) {
      return { ok: false };
    }
    setOwnerSubmitting(true);
    setOwnerError(null);
    const email = basics.email.trim();
    const pwd = ownerPassword;

    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp(
        {
          email,
          password: pwd,
        }
      );

      if (signUpErr || !signUpData.user) {
        setOwnerError(signUpErr?.message ?? 'No se pudo crear la cuenta.');
        return { ok: false };
      }

      const { error: profileErr } = await insertWaiterProfile(supabase, {
        id: signUpData.user.id,
        email,
        full_name: basics.ownerName.trim(),
        employee_number: null,
        restaurant_id: result.restaurantId,
        role: 'owner',
      });

      if (profileErr) {
        console.error('submitOwnerAccount:profile', profileErr);
        setOwnerError(
          'No se pudo vincular el perfil al restaurante. Intenta iniciar sesión desde /login.'
        );
        return { ok: false };
      }

      if (signUpData.session) {
        return { ok: true };
      }

      const { data: signInData, error: signInErr } =
        await supabase.auth.signInWithPassword({
          email,
          password: pwd,
        });

      if (signInErr || !signInData.session) {
        setOwnerError(
          'Cuenta creada. Confirma tu correo si te lo pidió Supabase y luego entra en /login.'
        );
        return { ok: false, needsEmailConfirm: true };
      }

      return { ok: true };
    } catch (e) {
      console.error('submitOwnerAccount', e);
      setOwnerError('Error inesperado al crear la cuenta.');
      return { ok: false };
    } finally {
      setOwnerSubmitting(false);
    }
  }, [
    result,
    canSubmitOwnerAccount,
    ownerSubmitting,
    basics.email,
    basics.ownerName,
    ownerPassword,
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
    canAdvanceFromStep1,
    canAdvanceFromStep2,
    canSubmit,
    canSubmitOwnerAccount,
    submitting,
    error,
    result,
    ownerSubmitting,
    ownerError,
    goNext,
    goBack,
    submit,
    submitOwnerAccount,
  };
}
