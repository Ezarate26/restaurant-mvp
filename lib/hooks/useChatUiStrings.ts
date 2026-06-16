'use client';

import { useEffect, useMemo, useState } from 'react';
import { normalizeLanguageCode } from '@/constants/languages';
import {
  CHAT_UI_SOURCE_LANG,
  chatUiPhraseNeedsTranslation,
  getChatUiSourceStrings,
  getChatUiStrings,
  type ChatUiStrings,
} from '@/lib/constants/chat-ui-strings';
import { translateWithCache } from '@/lib/model/translation-cache.repository';
import { supabase } from '@/lib/supabase';

const TITLE_EMOJI: Partial<Record<keyof ChatUiStrings, string>> = {
  audioOriginalTitle: '🎤',
  audioTranslatedTitle: '🤖',
};

function stripLeadingEmoji(value: string): string {
  return value.replace(/^(🎤|🤖)\s*/, '').trim();
}

function withLeadingEmoji(key: keyof ChatUiStrings, text: string): string {
  const emoji = TITLE_EMOJI[key];
  return emoji ? `${emoji} ${text}` : text;
}

const uiStringMemCache = new Map<string, string>();

async function translateUiPhrase(
  phrase: string,
  targetLang: string
): Promise<string> {
  const to = normalizeLanguageCode(targetLang);
  const from = CHAT_UI_SOURCE_LANG;
  if (from === to) return phrase;

  const cacheKey = `${from}:${to}:${phrase}`;
  const cached = uiStringMemCache.get(cacheKey);
  if (cached) return cached;

  const translated = await translateWithCache(supabase, phrase, from, to);
  uiStringMemCache.set(cacheKey, translated);
  return translated;
}

export function useChatUiStrings(
  viewerLanguage: string | null | undefined
): ChatUiStrings {
  const staticUi = useMemo(
    () => getChatUiStrings(viewerLanguage),
    [viewerLanguage]
  );
  const [ui, setUi] = useState<ChatUiStrings>(staticUi);

  useEffect(() => {
    setUi(staticUi);

    const code = normalizeLanguageCode(viewerLanguage ?? CHAT_UI_SOURCE_LANG);
    if (code === CHAT_UI_SOURCE_LANG) return;
    if (!chatUiPhraseNeedsTranslation(viewerLanguage, 'audioOriginalTitle')) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const source = getChatUiSourceStrings();
      const phrase = stripLeadingEmoji(source.audioOriginalTitle);
      try {
        const translated = await translateUiPhrase(phrase, code);
        if (cancelled) return;
        setUi((prev) => ({
          ...prev,
          audioOriginalTitle: withLeadingEmoji(
            'audioOriginalTitle',
            translated
          ),
        }));
      } catch (e) {
        console.error('useChatUiStrings:audioOriginalTitle', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewerLanguage, staticUi]);

  return ui;
}
