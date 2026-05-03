'use client';

import { LoginView } from '@/components/auth/LoginView';
import { useAuthViewModel } from '@/lib/viewmodels/useAuthViewModel';

export default function AuthPage() {
  const vm = useAuthViewModel();

  return (
    <LoginView
      isLogin={vm.isLogin}
      onToggleMode={() => vm.setIsLogin(!vm.isLogin)}
      email={vm.email}
      onEmailChange={vm.setEmail}
      password={vm.password}
      onPasswordChange={vm.setPassword}
      fullName={vm.fullName}
      onFullNameChange={vm.setFullName}
      employeeNumber={vm.employeeNumber}
      onEmployeeNumberChange={vm.setEmployeeNumber}
      restaurantCode={vm.restaurantCode}
      onRestaurantCodeChange={vm.setRestaurantCode}
      onSubmit={vm.handleAuth}
    />
  );
}
