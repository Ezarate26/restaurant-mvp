'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchUserById,
  updateUserProfile,
  upsertUserProfile,
} from '@/lib/model/profiles.repository';
import {
  removeUserAvatar,
  uploadUserAvatar,
} from '@/lib/storage/avatar.storage';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from '@/lib/utils/phone';
import { normalizeLanguageCode } from '@/constants/languages';

export function useProfileViewModel() {
  const { t } = useAppLanguage();
  const { user, isAuthenticated, isLoading: authLoading } = useSupabaseAuth();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('es');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      setDisplayName('');
      setPhone('');
      setNativeLanguage('es');
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        let profile = await fetchUserById(supabase, user.id);
        const meta = user.user_metadata ?? {};
        const metaName =
          typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
        const metaPhone =
          typeof meta.phone === 'string' ? meta.phone.trim() : '';

        if (!profile) {
          await upsertUserProfile(supabase, {
            id: user.id,
            email: user.email ?? null,
            display_name: metaName || null,
            phone: metaPhone || null,
          });
          profile = await fetchUserById(supabase, user.id);
        }

        if (cancelled) return;

        setDisplayName(
          profile?.display_name?.trim() ||
            metaName ||
            user.email?.split('@')[0] ||
            ''
        );
        setPhone(profile?.phone?.trim() || metaPhone || '');
        setNativeLanguage(
          normalizeLanguageCode(profile?.native_language ?? 'es')
        );
        setAvatarUrl(profile?.avatar_url ?? null);
      } catch (e) {
        console.error('useProfileViewModel:load', e);
        if (!cancelled) setError(t.profile.saveError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user, t.profile.saveError]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setError(null);

    const phoneNormalized = phone.trim() ? normalizePhoneNumber(phone) : '';
    if (phoneNormalized && !isValidPhoneNumber(phoneNormalized)) {
      setError(t.profile.phoneInvalid);
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(supabase, user.id, {
        display_name: displayName.trim() || null,
        phone: phoneNormalized || null,
        native_language: normalizeLanguageCode(nativeLanguage),
        avatar_url: avatarUrl,
      });

      await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim() || null,
          phone: phoneNormalized || null,
        },
      });

      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error('useProfileViewModel:save', e);
      setError(t.profile.saveError);
    } finally {
      setSaving(false);
    }
  }, [
    user,
    phone,
    displayName,
    nativeLanguage,
    avatarUrl,
    t.profile.phoneInvalid,
    t.profile.saveError,
  ]);

  const handleAvatarPick = useCallback(() => {
    if (!isAuthenticated) return;
    fileInputRef.current?.click();
  }, [isAuthenticated]);

  const handleAvatarChange = useCallback(
    async (file: File | null) => {
      if (!file || !user) return;
      setError(null);
      setUploadingAvatar(true);
      try {
        const url = await uploadUserAvatar(supabase, {
          userId: user.id,
          file,
        });
        setAvatarUrl(url);
        await updateUserProfile(supabase, user.id, { avatar_url: url });
      } catch (e) {
        console.error('useProfileViewModel:avatar', e);
        setError(
          e instanceof Error ? e.message : t.profile.saveError
        );
      } finally {
        setUploadingAvatar(false);
      }
    },
    [user, t.profile.saveError]
  );

  const handleRemoveAvatar = useCallback(async () => {
    if (!user || !avatarUrl) return;
    setUploadingAvatar(true);
    try {
      await removeUserAvatar(supabase, avatarUrl);
      setAvatarUrl(null);
      await updateUserProfile(supabase, user.id, { avatar_url: null });
    } catch (e) {
      console.error('useProfileViewModel:removeAvatar', e);
      setError(t.profile.saveError);
    } finally {
      setUploadingAvatar(false);
    }
  }, [user, avatarUrl, t.profile.saveError]);

  return {
    isAuthenticated,
    authLoading,
    loading,
    saving,
    uploadingAvatar,
    saved,
    error,
    displayName,
    setDisplayName,
    phone,
    setPhone,
    nativeLanguage,
    setNativeLanguage,
    avatarUrl,
    fileInputRef,
    handleSave,
    handleAvatarPick,
    handleAvatarChange,
    handleRemoveAvatar,
  };
}
