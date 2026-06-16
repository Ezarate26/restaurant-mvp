'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import {
  uiBtnPrimary,
  uiCard,
  uiInput,
  uiLabel,
  uiSelect,
  uiSuccess,
} from '@/components/ui/ui-classes';
import { getOrCreateCustomerIdentifier } from '@/lib/utils/customerIdentifier';
import { LANGUAGES } from '@/constants/languages';

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('es');
  const [country, setCountry] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('conversationPlatform.profile');
      if (!raw) return;
      const data = JSON.parse(raw) as {
        displayName?: string;
        bio?: string;
        nativeLanguage?: string;
        country?: string;
      };
      if (data.displayName) setDisplayName(data.displayName);
      if (data.bio) setBio(data.bio);
      if (data.nativeLanguage) setNativeLanguage(data.nativeLanguage);
      if (data.country) setCountry(data.country);
    } catch {
      /* noop */
    }
  }, []);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      displayName,
      bio,
      nativeLanguage,
      country,
      deviceId: getOrCreateCustomerIdentifier(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('conversationPlatform.profile', JSON.stringify(payload));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell>
      <form className={`${uiCard} min-w-0`} onSubmit={handleSave}>
        <h1 className="text-xl font-bold sm:text-2xl">Mi perfil</h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          Opcional para usuarios anónimos. Los datos se guardan en este
          dispositivo.
        </p>

        <label className={`${uiLabel} mt-6`} htmlFor="profile-name">
          Nombre visible
        </label>
        <input
          id="profile-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={uiInput}
        />

        <label className={`${uiLabel} mt-4`} htmlFor="profile-bio">
          Descripción
        </label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className={uiInput}
        />

        <label className={`${uiLabel} mt-4`} htmlFor="profile-language">
          Idioma principal
        </label>
        <select
          id="profile-language"
          value={nativeLanguage}
          onChange={(e) => setNativeLanguage(e.target.value)}
          className={uiSelect}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>

        <label className={`${uiLabel} mt-4`} htmlFor="profile-country">
          País (opcional)
        </label>
        <input
          id="profile-country"
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={uiInput}
        />

        {saved ? <p className={`${uiSuccess} mt-4`}>Perfil guardado</p> : null}

        <FormSubmitLabel
          id="profile-save"
          label="Guardar perfil"
          className={`${uiBtnPrimary} mt-6`}
        />
      </form>
    </AppShell>
  );
}
