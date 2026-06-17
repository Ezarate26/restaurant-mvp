'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { savePendingVerifyCredentials } from '@/lib/auth/pending-registration.storage';
import { markShowProInvite } from '@/lib/auth/pro-invite.storage';
import {
  AUTH_ENTRY_PATHS,
  AUTH_HOME_PATH,
} from '@/lib/constants/routes';
import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from '@/lib/utils/phone';

const MIN_PASSWORD_LEN = 6;

function isEmailNotConfirmedError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('email not confirmed') ||
    m.includes('not confirmed') ||
    m.includes('email_not_confirmed')
  );
}

export function useAuthViewModel(initialIsLogin = true) {
  const router = useRouter();
  const pathname = usePathname();

  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const registerPasswordMismatch = useMemo(
    () =>
      !isLogin &&
      confirmPassword.length > 0 &&
      password !== confirmPassword,
    [isLogin, password, confirmPassword]
  );

  useEffect(() => {
    setFormError(null);
  }, [isLogin]);

  useEffect(() => {
    if (!AUTH_ENTRY_PATHS.includes(pathname as (typeof AUTH_ENTRY_PATHS)[number])) {
      return;
    }
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !data.session?.user) return;
      router.replace(AUTH_HOME_PATH);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const handleAuth = useCallback(async () => {
    setFormError(null);

    if (!email || !password) {
      setFormError('Completa correo y contraseña.');
      return;
    }

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (isEmailNotConfirmedError(error.message)) {
          savePendingVerifyCredentials(email, password);
          router.push('/verify-email');
          return;
        }
        setFormError('Credenciales incorrectas');
        return;
      }

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        savePendingVerifyCredentials(email, password);
        router.push('/verify-email');
        return;
      }

      router.push(AUTH_HOME_PATH);
      return;
    }

    if (password.length < MIN_PASSWORD_LEN) {
      setFormError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres`
      );
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }

    const phoneNormalized = normalizePhoneNumber(phone);
    if (!phoneNormalized) {
      setFormError('Ingresa tu número telefónico.');
      return;
    }
    if (!isValidPhoneNumber(phoneNormalized)) {
      setFormError('Ingresa un número telefónico válido (10 a 15 dígitos).');
      return;
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || null,
          phone: phoneNormalized,
        },
      },
    });

    if (error || !signUpData.user) {
      setFormError(error?.message || 'Error creando usuario');
      return;
    }

    if (signUpData.session) {
      markShowProInvite();
      router.replace(AUTH_HOME_PATH);
      return;
    }

    savePendingVerifyCredentials(email.trim(), password);
    router.push('/verify-email');
  }, [
    email,
    password,
    confirmPassword,
    isLogin,
    fullName,
    phone,
    router,
  ]);

  return {
    isLogin,
    setIsLogin,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    fullName,
    setFullName,
    phone,
    setPhone,
    formError,
    registerPasswordMismatch,
    handleAuth,
  };
}
