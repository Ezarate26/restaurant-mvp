'use client';

import { useEffect, useRef, useState } from 'react';
import { TapButton } from '@/components/ui/TapButton';
import {
  languageDisplayNameInLocale,
  normalizeLanguageCode,
} from '@/constants/languages';
import { useChatUiStrings } from '@/lib/hooks/useChatUiStrings';
import { supabase } from '@/lib/supabase';
import { getVoiceAudioPlaybackUrl } from '@/lib/storage/voice-audio.storage';
import { resolveVoiceTtsAudioUrl } from '@/lib/model/voice-tts-cache.repository';

type AudioPlaybackBlockProps = {
  variant: 'original' | 'translated';
  viewerLanguage?: string | null;
  languageCode: string | null;
  audioUrl?: string | null;
  ttsText?: string | null;
  durationSeconds?: number | null;
};

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const total = Math.max(0, Math.floor(seconds));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function AudioPlaybackBlock({
  variant,
  viewerLanguage = null,
  languageCode,
  audioUrl = null,
  ttsText = null,
  durationSeconds = null,
}: AudioPlaybackBlockProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [liveDuration, setLiveDuration] = useState<number | null>(null);

  const ui = useChatUiStrings(viewerLanguage);
  const title =
    variant === 'original' ? ui.audioOriginalTitle : ui.audioTranslatedTitle;
  const langLabel = languageCode
    ? languageDisplayNameInLocale(
        normalizeLanguageCode(languageCode),
        viewerLanguage
      )
    : '—';

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setPlaybackUrl(null);
    setPlaying(false);
    setLiveDuration(null);

    if (variant === 'original' && audioUrl) {
      void getVoiceAudioPlaybackUrl(supabase, audioUrl).then((url) => {
        if (!cancelled) setPlaybackUrl(url);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [variant, audioUrl]);

  const loadTranslatedAudio = async (): Promise<string | null> => {
    const text = ttsText?.trim();
    const lang = languageCode?.trim();
    if (!text || !lang) return null;
    setBusy(true);
    try {
      const url = await resolveVoiceTtsAudioUrl(supabase, text, lang);
      if (url) {
        const signed = await getVoiceAudioPlaybackUrl(supabase, url);
        setPlaybackUrl(signed);
        return signed;
      }
      return null;
    } finally {
      setBusy(false);
    }
  };

  const togglePlay = async () => {
    const el = audioRef.current;
    try {
      if (el && !el.paused && playbackUrl) {
        el.pause();
        setPlaying(false);
        return;
      }

      let url = playbackUrl;
      if (variant === 'translated' && !url) {
        url = await loadTranslatedAudio();
      }
      if (!url || !el) {
        setError(true);
        return;
      }
      if (el.src !== url) el.src = url;
      el.currentTime = 0;
      await el.play();
      setPlaying(true);
      setError(false);
    } catch (e) {
      console.error('AudioPlaybackBlock:play', e);
      setError(true);
      setPlaying(false);
    }
  };

  const displayDuration = durationSeconds ?? liveDuration;
  const accentRing =
    variant === 'translated'
      ? 'ring-[var(--app-accent)]/40'
      : 'ring-[var(--app-success)]/40';

  return (
    <div
      className={`mt-1 max-w-sm rounded-xl bg-[var(--app-card)] px-3 py-2.5 ring-1 ${accentRing} transition duration-200 hover:bg-[var(--app-hover-bg)]`}
    >
      <p className="text-xs font-semibold text-[var(--app-text)]">
        {variant === 'original' ? '🎤 ' : '🤖 '}
        {title}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <TapButton
          onTap={() => void togglePlay()}
          disabled={
            busy ||
            (variant === 'original' ? !audioUrl : !ttsText?.trim())
          }
          className="app-touchable touch-target btn-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
          aria-label={
            variant === 'original' ? ui.playOriginal : ui.playTranslation
          }
        >
          <span aria-hidden>{playing ? '⏸' : '▶'}</span>
        </TapButton>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--app-text)]">
            {busy
              ? ui.loading
              : playing
                ? ui.pause
                : variant === 'original'
                  ? ui.playOriginal
                  : ui.playTranslation}
          </p>
          <p className="text-[10px] text-[var(--app-muted)]">
            {ui.languageLabel} {langLabel}
            {displayDuration != null ? ` · ${formatDuration(displayDuration)}` : ''}
          </p>
        </div>
      </div>
      {error ? (
        <p className="mt-1.5 text-[10px] text-[var(--app-danger)]">
          {ui.playbackError}
        </p>
      ) : null}
      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        className="hidden"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setLiveDuration(Math.round(d));
        }}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
      />
    </div>
  );
}
