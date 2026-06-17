'use client';

import { LoginView } from '@/components/auth/LoginView';
import { useAuthViewModel } from '@/lib/viewmodels/useAuthViewModel';

export default function RegisterPage() {
  const vm = useAuthViewModel(false);

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
      phone={vm.phone}
      onPhoneChange={vm.setPhone}
      formError={vm.formError}
      registerPasswordMismatch={vm.registerPasswordMismatch}
      onSubmit={vm.handleAuth}
    />
  );
}
