'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchUserById,
  updateUserProfile,
  upsertUserProfile,
} from '@/lib/model/profiles.repository';
import { logoutAndReturnToLanding } from '@/lib/auth/session-logout';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';

const MIN_PASSWORD_LEN = 6;

export function useSettingsViewModel() {
  const { t } = useAppLanguage();
  const { user, isAuthenticated, isLoading: authLoading } = useSupabaseAuth();

  const [defaultLanguage, setDefaultLanguage] = useState('es');
  const [notifications, setNotifications] = useState(true);
  const [bio, setBio] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('conversationPlatform.settings');
      if (!raw) return;
      const data = JSON.parse(raw) as {
        defaultLanguage?: string;
        notifications?: boolean;
      };
      if (data.defaultLanguage) setDefaultLanguage(data.defaultLanguage);
      if (typeof data.notifications === 'boolean') {
        setNotifications(data.notifications);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) {
      if (!authLoading && !isAuthenticated) setBio('');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        let profile = await fetchUserById(supabase, user.id);
        if (!profile) {
          await upsertUserProfile(supabase, {
            id: user.id,
            email: user.email ?? null,
          });
          profile = await fetchUserById(supabase, user.id);
        }
        if (!cancelled) setBio(profile?.bio?.trim() ?? '');
      } catch (e) {
        console.error('useSettingsViewModel:loadBio', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user]);

  const handleSaveSettings = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      localStorage.setItem(
        'conversationPlatform.settings',
        JSON.stringify({ defaultLanguage, notifications })
      );
      setSettingsSaved(true);
      window.setTimeout(() => setSettingsSaved(false), 2500);
    },
    [defaultLanguage, notifications]
  );

  const handleSaveBio = useCallback(async () => {
    if (!user) return;
    setBioLoading(true);
    try {
      await updateUserProfile(supabase, user.id, {
        bio: bio.trim() || null,
      });
      setBioSaved(true);
      window.setTimeout(() => setBioSaved(false), 2500);
    } catch (e) {
      console.error('useSettingsViewModel:saveBio', e);
    } finally {
      setBioLoading(false);
    }
  }, [user, bio]);

  const handleChangePassword = useCallback(async () => {
    setPasswordError(null);
    if (newPassword.length < MIN_PASSWORD_LEN) {
      setPasswordError(t.settings.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.settings.passwordMismatch);
      return;
    }

    setPasswordBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      window.setTimeout(() => setPasswordSaved(false), 2500);
    } catch (e) {
      console.error('useSettingsViewModel:password', e);
      setPasswordError(t.settings.passwordError);
    } finally {
      setPasswordBusy(false);
    }
  }, [
    newPassword,
    confirmPassword,
    t.settings.passwordTooShort,
    t.settings.passwordMismatch,
    t.settings.passwordError,
  ]);

  const handleLogout = useCallback(async () => {
    await logoutAndReturnToLanding();
  }, []);

  return {
    isAuthenticated,
    authLoading,
    defaultLanguage,
    setDefaultLanguage,
    notifications,
    setNotifications,
    bio,
    setBio,
    settingsSaved,
    bioSaved,
    bioLoading,
    handleSaveSettings,
    handleSaveBio,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordBusy,
    passwordSaved,
    passwordError,
    handleChangePassword,
    handleLogout,
  };
}
