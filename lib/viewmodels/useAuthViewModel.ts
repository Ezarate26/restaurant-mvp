'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchProfileByUserId } from '@/lib/model/profiles.repository';
import { fetchRestaurantByInviteCode } from '@/lib/model/restaurants.repository';
import {
  savePendingVerifyCredentials,
  savePendingWaiterRegistration,
} from '@/lib/auth/pending-registration.storage';
import { normalizeAppLanguage } from '@/lib/model/language-options';
import {
  finalizePendingRegistration,
  precheckWaiterSignupEmail,
} from '@/lib/auth/finalize-pending-registration';

const MIN_PASSWORD_LEN = 6;

function isEmailNotConfirmedError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('email not confirmed') ||
    m.includes('not confirmed') ||
    m.includes('email_not_confirmed')
  );
}

export function useAuthViewModel() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [waiterPhone, setWaiterPhone] = useState('');
  const [restaurantCode, setRestaurantCode] = useState('');
  const [waiterLanguage, setWaiterLanguage] = useState('es');
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

    const routeIfReady = async (
      userId: string | undefined,
      emailKnown: string | null | undefined
    ) => {
      if (!userId) return;
      const profile = await fetchProfileByUserId(supabase, userId);
      if (cancelled) return;
      if (!profile?.restaurant_id) return;
      router.replace(profile.role === 'owner' ? '/owner' : '/waiter');
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !data.session?.user) return;
      void routeIfReady(data.session.user.id, data.session.user.email);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled || pathname !== '/login') return;
      void routeIfReady(session?.user?.id, session?.user?.email ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
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

      if (!data.user) return;

      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        savePendingVerifyCredentials(email, password);
        router.push('/verify-email');
        return;
      }

      const profile = await fetchProfileByUserId(supabase, data.user.id);

      if (!profile?.restaurant_id) {
        setFormError('Usuario sin restaurante');
        await supabase.auth.signOut();
        return;
      }

      router.push(profile.role === 'owner' ? '/owner' : '/waiter');
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

    if (!restaurantCode.trim()) {
      setFormError('Ingresa el código del restaurante');
      return;
    }

    if (!fullName.trim()) {
      setFormError('Ingresa tu nombre');
      return;
    }

    if (!waiterPhone.trim()) {
      setFormError('Ingresa tu teléfono');
      return;
    }

    const restaurant = await fetchRestaurantByInviteCode(
      supabase,
      restaurantCode.trim().toUpperCase()
    );

    if (!restaurant) {
      setFormError('Código de restaurante inválido');
      return;
    }

    const pre = await precheckWaiterSignupEmail(supabase, email);
    if (!pre.ok) {
      setFormError(pre.message);
      return;
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'waiter',
          phone: waiterPhone.trim(),
        },
      },
    });

    if (error || !signUpData.user) {
      setFormError(error?.message || 'Error creando usuario');
      return;
    }

    savePendingWaiterRegistration({
      restaurantCode: restaurantCode.trim().toUpperCase(),
      fullName: fullName.trim(),
      employeeNumber: employeeNumber.trim() || null,
      language: normalizeAppLanguage(waiterLanguage),
    });

    const userId = signUpData.user.id;
    const resolvedEmail = signUpData.user.email ?? email.trim();

    if (signUpData.session) {
      const fin = await finalizePendingRegistration(
        supabase,
        userId,
        resolvedEmail
      );
      if (!fin.ok) {
        setFormError(fin.message);
        return;
      }
      router.replace('/waiter');
      return;
    }

    savePendingVerifyCredentials(email.trim(), password);
    router.push('/verify-email');
  }, [
    email,
    password,
    confirmPassword,
    isLogin,
    restaurantCode,
    fullName,
    employeeNumber,
    waiterPhone,
    waiterLanguage,
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
    employeeNumber,
    setEmployeeNumber,
    waiterPhone,
    setWaiterPhone,
    restaurantCode,
    setRestaurantCode,
    waiterLanguage,
    setWaiterLanguage,
    formError,
    registerPasswordMismatch,
    handleAuth,
  };
}
