'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getOrCreateCustomerIdentifier } from '@/lib/utils/customerIdentifier';
import { LANGUAGES } from '@/constants/languages';

const fieldClass =
  'w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

const multiSelectClass = `${fieldClass} min-h-[10rem] py-2`;

export interface CompleteProfileFormProps {
  initialEmail?: string;
  /** Para regresar al mismo chat al guardar el registro. */
  resumeServicePointId?: string | null;
  resumeSessionId?: string | null;
  resumeQrCode?: string | null;
}

export function CompleteProfileForm({
  initialEmail = '',
  resumeServicePointId = null,
  resumeSessionId = null,
  resumeQrCode = null,
}: CompleteProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(initialEmail.trim().toLowerCase());
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [languages, setLanguages] = useState<string[]>(['es']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateFlow, setDuplicateFlow] = useState<{
    message: string;
    resumePath: string;
  } | null>(null);
  const [successFlow, setSuccessFlow] = useState<{
    loginPath: string;
  } | null>(null);

  const emailNorm = email.trim().toLowerCase();

  const loginPathFor = (registeredEmail: string, apiResumePath?: string | null): string => {
    const em = registeredEmail.trim().toLowerCase();
    const appendLoginParams = (basePath: string): string => {
      const [pathOnly, rawQuery] = basePath.split('?');
      const q = new URLSearchParams(rawQuery ?? '');
      q.delete('open_chat');
      q.set('open_login', '1');
      q.set('login_email', em);
      const qs = q.toString();
      return qs ? `${pathOnly}?${qs}` : pathOnly;
    };

    const candidate = apiResumePath?.trim() ?? '';
    if (candidate.startsWith('/qr/')) {
      return appendLoginParams(candidate);
    }

    if (resumeQrCode?.trim()) {
      return appendLoginParams(`/qr/${encodeURIComponent(resumeQrCode.trim())}`);
    }

    if (resumeServicePointId?.trim()) {
      const q = new URLSearchParams();
      if (resumeSessionId?.trim()) q.set('session', resumeSessionId.trim());
      const sid = encodeURIComponent(resumeServicePointId.trim());
      const base = `/qr/${sid}`;
      const withSession = q.toString() ? `${base}?${q.toString()}` : base;
      return appendLoginParams(withSession);
    }

    return '/';
  };

  const canSubmit =
    Boolean(emailNorm) &&
    password.length >= 8 &&
    password === confirm &&
    fullName.trim().length > 0 &&
    languages.length > 0;

  const submit = async () => {
    setError(null);
    if (!canSubmit) {
      setError(
        'Completa nombre, al menos un idioma, correo y una contraseña de al menos 8 caracteres (ambas iguales).'
      );
      return;
    }
    setBusy(true);
    try {
      let device_id: string | null = null;
      try {
        device_id = getOrCreateCustomerIdentifier();
      } catch {
        device_id = null;
      }

      const res = await fetch('/api/customer/register-from-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailNorm,
          password,
          full_name: fullName.trim(),
          username: username.trim() || null,
          phone: phone.trim() || null,
          languages,
          device_id,
          resume_service_point_id: resumeServicePointId?.trim() || null,
          resume_session_id: resumeSessionId?.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        resumePath?: string | null;
        alreadyRegistered?: boolean;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? 'No se pudo registrar');
      }

      if (data.alreadyRegistered) {
        setDuplicateFlow({
          message:
            data.message?.trim() ||
            'Ya tenemos tu correo registrado. Revisa tu bandeja o continúa como invitado.',
          resumePath: (data.resumePath ?? '/').trim() || '/',
        });
        return;
      }

      const path = data.resumePath?.trim();
      const loginPath = loginPathFor(emailNorm, path);
      setSuccessFlow({ loginPath });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar');
    } finally {
      setBusy(false);
    }
  };

  if (duplicateFlow) {
    return (
      <div className="rounded-xl border border-[#229ED9]/25 bg-[#E3F2FD]/80 px-4 py-5 text-sm text-[#0D47A1]">
        <p className="font-semibold leading-relaxed">{duplicateFlow.message}</p>
        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-[#229ED9] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          onClick={() => router.push(duplicateFlow.resumePath)}
        >
          Continuar
        </button>
        <Link
          href="/"
          className="mt-3 inline-block text-center text-sm font-medium text-[#229ED9] hover:underline"
        >
          Ir al inicio
        </Link>
      </div>
    );
  }

  if (successFlow) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-900">
        <p className="font-semibold leading-relaxed">
          Tu cuenta se creó correctamente.
        </p>
        <p className="mt-2 leading-relaxed">
          Ahora inicia sesión para entrar al chat.
        </p>
        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-[#229ED9] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          onClick={() => router.replace(successFlow.loginPath)}
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <p className="text-sm leading-relaxed text-[#6B7280]">
        Crea tu contraseña y datos de contacto. Los usarás para iniciar sesión cuando
        vuelvas al restaurante.
      </p>

      <div>
        <label className="mb-2 block text-xs font-medium text-[#374151]">
          Idiomas preferidos <span className="text-red-600">*</span>
        </label>
        <select
          multiple
          disabled={busy}
          value={languages}
          size={8}
          aria-label="Idiomas preferidos"
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map(
              (o) => o.value
            );
            const rank = new Map(LANGUAGES.map((l, i) => [l.code, i]));
            const sorted = [...new Set(selected)].sort(
              (a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0)
            );
            setLanguages(sorted.length > 0 ? sorted : ['es']);
          }}
          className={multiSelectClass}
        >
          {LANGUAGES.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-[#9CA3AF]">
          Mantén pulsada Ctrl (Windows) o ⌘ (Mac) para elegir varios. Entre los
          seleccionados, el idioma principal en el chat es el que aparece antes en este listado.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#374151]">
          Nombre completo <span className="text-red-600">*</span>
        </label>
        <input
          className={fieldClass}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ej. María González"
          autoComplete="name"
          disabled={busy}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#374151]">
          Usuario (opcional)
        </label>
        <input
          className={fieldClass}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Alias público"
          autoComplete="username"
          disabled={busy}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#374151]">
          Teléfono (opcional)
        </label>
        <input
          className={fieldClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+52 …"
          autoComplete="tel"
          inputMode="tel"
          disabled={busy}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#374151]">
          Correo <span className="text-red-600">*</span>
        </label>
        <input
          className={fieldClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          inputMode="email"
          disabled={busy}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#374151]">
          Contraseña <span className="text-red-600">*</span>
        </label>
        <input
          type="password"
          className={fieldClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          disabled={busy}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#374151]">
          Confirmar contraseña <span className="text-red-600">*</span>
        </label>
        <input
          type="password"
          className={fieldClass}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          disabled={busy}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={() => void submit()}
        className="w-full rounded-xl bg-[#229ED9] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Guardando…' : 'Crear cuenta'}
      </button>
    </div>
  );
}
