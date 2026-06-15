'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { savePendingVerifyCredentials } from '@/lib/auth/pending-registration.storage';

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
    if (pathname !== '/login') return;
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !data.session?.user) return;
      router.replace('/');
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

      router.push('/');
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

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || null,
        },
      },
    });

    if (error || !signUpData.user) {
      setFormError(error?.message || 'Error creando usuario');
      return;
    }

    if (signUpData.session) {
      router.replace('/');
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
    formError,
    registerPasswordMismatch,
    handleAuth,
  };
}
