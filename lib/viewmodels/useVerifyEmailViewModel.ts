'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { readPendingVerifyCredentials } from '@/lib/auth/pending-registration.storage';
import { finalizePendingRegistration } from '@/lib/auth/finalize-pending-registration';

function isEmailNotConfirmedMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('email not confirmed') ||
    m.includes('not confirmed') ||
    m.includes('email_not_confirmed')
  );
}

export function useVerifyEmailViewModel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  const runFinalize = useCallback(
    async (userId: string, email: string): Promise<boolean> => {
      const result = await finalizePendingRegistration(
        supabase,
        userId,
        email
      );
      if (!result.ok) {
        setProvisionError(result.message);
        return false;
      }
      router.replace(result.dashboard === 'owner' ? '/owner' : '/waiter');
      return true;
    },
    [router]
  );

  const onVerifiedClick = useCallback(async () => {
    setError(null);
    setProvisionError(null);
    setLoading(true);
    try {
      const creds = readPendingVerifyCredentials();
      if (!creds) {
        setError(
          'No hay credenciales guardadas para continuar. Vuelve a registrarte o inicia sesión en /login.'
        );
        return;
      }

      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });

      if (signErr || !data.user) {
        if (isEmailNotConfirmedMessage(signErr?.message ?? '')) {
          setError('Verifica tu correo para continuar');
        } else {
          setError(
            signErr?.message?.includes('Invalid login')
              ? 'Credenciales incorrectas o correo sin verificar'
              : signErr?.message ?? 'No se pudo iniciar sesión'
          );
        }
        return;
      }

      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setError('Verifica tu correo para continuar');
        return;
      }

      const emailResolved =
        data.user.email ?? data.session?.user.email ?? creds.email;

      await runFinalize(data.user.id, emailResolved);
    } catch (e) {
      console.error('useVerifyEmailViewModel:onVerifiedClick', e);
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [runFinalize]);

  const retryProvisioning = useCallback(async () => {
    setProvisionError(null);
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.email) {
        setProvisionError(
          'Sesión no válida. Pulsa «Correo verificado» de nuevo.'
        );
        return;
      }
      await runFinalize(auth.user.id, auth.user.email);
    } catch (e) {
      console.error('useVerifyEmailViewModel:retryProvisioning', e);
      setProvisionError('Error al reintentar.');
    } finally {
      setLoading(false);
    }
  }, [runFinalize]);

  return {
    loading,
    error,
    provisionError,
    onVerifiedClick,
    retryProvisioning,
  };
}
