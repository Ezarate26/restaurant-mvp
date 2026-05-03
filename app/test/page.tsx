'use client';

import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function TestPage() {
    console.log('TestPage');
  useEffect(() => {
    const testInsert = async () => {
        console.log('testInsert');
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            table_id: '1',
            sender: 'client',
            text: 'hola desde test',
          },
        ]);

      console.log('DATA:', data);
      console.log('ERROR:', error);
    };

    testInsert();
  }, []);

  return <div>Test Supabase</div>;
}