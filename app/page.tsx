'use client';

import { HomeTablePickerView } from '@/components/home/HomeTablePickerView';
import { useHomeTablePickerViewModel } from '@/lib/viewmodels/useHomeTablePickerViewModel';

export default function Home() {
  const vm = useHomeTablePickerViewModel();

  return (
    <HomeTablePickerView
      language={vm.language}
      onLanguageChange={vm.setLanguage}
      tables={vm.tables}
      onOrderNow={vm.orderNow}
      onEmployeeLogin={vm.goToEmployeeLogin}
    />
  );
}
