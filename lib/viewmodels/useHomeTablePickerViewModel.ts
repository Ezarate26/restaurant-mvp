'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchTablesByRestaurant } from '@/lib/model/tables.repository';
import { DEMO_RESTAURANT_ID } from '@/lib/config';
import type { Table } from '@/lib/model/types';

export function useHomeTablePickerViewModel() {
  const router = useRouter();
  const [language, setLanguage] = useState('');
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadTables = async () => {
      const data = await fetchTablesByRestaurant(supabase, DEMO_RESTAURANT_ID);
      if (!cancelled) setTables(data);
    };

    void loadTables();

    return () => {
      cancelled = true;
    };
  }, []);

  const goToEmployeeLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  const orderNow = useCallback(
    (tableId: string) => {
      if (!language) {
        alert('Selecciona idioma');
        return;
      }

      router.push(`/table/${tableId}?lang=${language}`);
    },
    [language, router]
  );

  return {
    language,
    setLanguage,
    tables,
    orderNow,
    goToEmployeeLogin,
  };
}
