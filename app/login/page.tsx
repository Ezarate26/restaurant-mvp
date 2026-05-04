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
      confirmPassword={vm.confirmPassword}
      onConfirmPasswordChange={vm.setConfirmPassword}
      showPassword={vm.showPassword}
      onToggleShowPassword={() => vm.setShowPassword((v) => !v)}
      showConfirmPassword={vm.showConfirmPassword}
      onToggleShowConfirmPassword={() =>
        vm.setShowConfirmPassword((v) => !v)
      }
      fullName={vm.fullName}
      onFullNameChange={vm.setFullName}
      employeeNumber={vm.employeeNumber}
      onEmployeeNumberChange={vm.setEmployeeNumber}
      waiterPhone={vm.waiterPhone}
      onWaiterPhoneChange={vm.setWaiterPhone}
      restaurantCode={vm.restaurantCode}
      onRestaurantCodeChange={vm.setRestaurantCode}
      waiterLanguage={vm.waiterLanguage}
      onWaiterLanguageChange={vm.setWaiterLanguage}
      formError={vm.formError}
      registerPasswordMismatch={vm.registerPasswordMismatch}
      onSubmit={vm.handleAuth}
    />
  );
}
