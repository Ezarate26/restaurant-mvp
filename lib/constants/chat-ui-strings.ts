import { normalizeLanguageCode } from '@/constants/languages';

export type ChatUiStrings = {
  audioOriginalTitle: string;
  audioTranslatedTitle: string;
  playOriginal: string;
  playTranslation: string;
  pause: string;
  loading: string;
  languageLabel: string;
  playbackError: string;
  processingAudio: string;
  originalLabel: string;
};

const UI_BY_LANG: Record<string, ChatUiStrings> = {
  es: {
    audioOriginalTitle: '🎤 Audio original',
    audioTranslatedTitle: '🤖 Voz traducida',
    playOriginal: 'Reproducir voz original',
    playTranslation: 'Reproducir traducción',
    pause: 'Pausar',
    loading: 'Cargando…',
    languageLabel: 'Idioma:',
    playbackError: 'No se pudo reproducir el audio',
    processingAudio: 'Procesando audio…',
    originalLabel: 'Original:',
  },
  en: {
    audioOriginalTitle: '🎤 Original audio',
    audioTranslatedTitle: '🤖 Translated voice',
    playOriginal: 'Play original voice',
    playTranslation: 'Play translation',
    pause: 'Pause',
    loading: 'Loading…',
    languageLabel: 'Language:',
    playbackError: 'Could not play audio',
    processingAudio: 'Processing audio…',
    originalLabel: 'Original:',
  },
  fr: {
    audioOriginalTitle: '🎤 Voix originale',
    audioTranslatedTitle: '🤖 Voix traduite',
    playOriginal: 'Écouter la voix originale',
    playTranslation: 'Écouter la traduction',
    pause: 'Pause',
    loading: 'Chargement…',
    languageLabel: 'Langue :',
    playbackError: "Impossible de lire l'audio",
    processingAudio: "Traitement de l'audio…",
    originalLabel: 'Original :',
  },
  de: {
    audioOriginalTitle: '🎤 Original-Audio',
    audioTranslatedTitle: '🤖 Übersetzte Stimme',
    playOriginal: 'Originalstimme abspielen',
    playTranslation: 'Übersetzung abspielen',
    pause: 'Pause',
    loading: 'Wird geladen…',
    languageLabel: 'Sprache:',
    playbackError: 'Audio konnte nicht abgespielt werden',
    processingAudio: 'Audio wird verarbeitet…',
    originalLabel: 'Original:',
  },
  it: {
    audioOriginalTitle: '🎤 Audio originale',
    audioTranslatedTitle: '🤖 Voce tradotta',
    playOriginal: 'Riproduci voce originale',
    playTranslation: 'Riproduci traduzione',
    pause: 'Pausa',
    loading: 'Caricamento…',
    languageLabel: 'Lingua:',
    playbackError: "Impossibile riprodurre l'audio",
    processingAudio: 'Elaborazione audio…',
    originalLabel: 'Originale:',
  },
  pt: {
    audioOriginalTitle: '🎤 Áudio original',
    audioTranslatedTitle: '🤖 Voz traduzida',
    playOriginal: 'Reproduzir voz original',
    playTranslation: 'Reproduzir tradução',
    pause: 'Pausar',
    loading: 'Carregando…',
    languageLabel: 'Idioma:',
    playbackError: 'Não foi possível reproduzir o áudio',
    processingAudio: 'Processando áudio…',
    originalLabel: 'Original:',
  },
};

export const CHAT_UI_SOURCE_LANG = 'es';

export function hasStaticChatUiStrings(
  viewerLanguage: string | null | undefined
): boolean {
  const code = normalizeLanguageCode(viewerLanguage ?? CHAT_UI_SOURCE_LANG);
  return code in UI_BY_LANG;
}

export function getChatUiStrings(
  viewerLanguage: string | null | undefined
): ChatUiStrings {
  const code = normalizeLanguageCode(viewerLanguage ?? CHAT_UI_SOURCE_LANG);
  return UI_BY_LANG[code] ?? UI_BY_LANG.en;
}

/** Texto base en español para traducir etiquetas vía translation_cache. */
export function getChatUiSourceStrings(): ChatUiStrings {
  return UI_BY_LANG[CHAT_UI_SOURCE_LANG];
}

export function chatUiPhraseNeedsTranslation(
  viewerLanguage: string | null | undefined,
  key: keyof ChatUiStrings
): boolean {
  const code = normalizeLanguageCode(viewerLanguage ?? CHAT_UI_SOURCE_LANG);
  if (code === CHAT_UI_SOURCE_LANG) return false;
  const current = getChatUiStrings(viewerLanguage);
  const source = UI_BY_LANG[CHAT_UI_SOURCE_LANG];
  if (!UI_BY_LANG[code]) return true;
  return current[key] === source[key];
}
