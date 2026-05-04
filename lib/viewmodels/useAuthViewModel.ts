'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  fetchProfileByUserId,
  insertWaiterProfile,
  countProfilesByRestaurant,
} from '@/lib/model/profiles.repository';
import { fetchRestaurantByInviteCode } from '@/lib/model/restaurants.repository';

export function useAuthViewModel() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [restaurantCode, setRestaurantCode] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const userId = data.session.user.id;
      const profile = await fetchProfileByUserId(supabase, userId);

      if (!profile?.restaurant_id) {
        await supabase.auth.signOut();
        return;
      }

      router.push(profile.role === 'owner' ? '/owner' : '/waiter');
    };

    void checkSession();
  }, [router]);

  const handleAuth = useCallback(async () => {
    if (!email || !password) {
      alert('Completa los campos');
      return;
    }

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          router.push('/verify');
          return;
        }
        alert('Credenciales incorrectas');
        return;
      }

      if (!data.user) return;

      const profile = await fetchProfileByUserId(supabase, data.user.id);

      if (!profile?.restaurant_id) {
        alert('Usuario sin restaurante');
        await supabase.auth.signOut();
        return;
      }

      router.push(profile.role === 'owner' ? '/owner' : '/waiter');
      return;
    }

    if (!restaurantCode) {
      alert('Ingresa el código del restaurante');
      return;
    }

    if (!fullName) {
      alert('Ingresa tu nombre');
      return;
    }

    const restaurant = await fetchRestaurantByInviteCode(
      supabase,
      restaurantCode.trim().toUpperCase()
    );

    if (!restaurant) {
      alert('Código de restaurante inválido');
      return;
    }

    // Primer perfil del restaurante => admin; el resto => waiter.
    const existingCount = await countProfilesByRestaurant(
      supabase,
      restaurant.id
    );
    const role = existingCount === 0 ? 'admin' : 'waiter';

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !signUpData.user) {
      alert(error?.message || 'Error creando usuario');
      return;
    }

    const { error: profileError } = await insertWaiterProfile(supabase, {
      id: signUpData.user.id,
      email,
      full_name: fullName,
      employee_number: employeeNumber || null,
      restaurant_id: restaurant.id,
      role,
    });

    if (profileError) {
      console.error(profileError);
      alert('Error creando perfil');
      return;
    }

    router.push('/verify');
  }, [
    email,
    password,
    isLogin,
    restaurantCode,
    fullName,
    employeeNumber,
    router,
  ]);

  return {
    isLogin,
    setIsLogin,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    employeeNumber,
    setEmployeeNumber,
    restaurantCode,
    setRestaurantCode,
    handleAuth,
  };
}
