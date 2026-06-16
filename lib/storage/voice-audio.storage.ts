import type { SupabaseClient } from '@supabase/supabase-js';
import { VOICE_STORAGE_BUCKET } from '@/lib/model/voice-messages.repository';

function extensionForMime(mimeType?: string): string {
  const base = mimeType?.split(';')[0]?.trim().toLowerCase() ?? 'audio/wav';
  if (base.includes('wav')) return 'wav';
  if (base.includes('ogg')) return 'ogg';
  if (base.includes('mp4') || base.includes('mpeg')) return 'm4a';
  if (base.includes('webm')) return 'webm';
  return 'wav';
}

function contentTypeForUpload(mimeType?: string): string {
  const ext = extensionForMime(mimeType);
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'ogg') return 'audio/ogg';
  if (ext === 'm4a') return 'audio/mp4';
  if (ext === 'webm') return 'audio/webm';
  return 'audio/wav';
}

export function voiceStoragePathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${VOICE_STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export async function uploadVoiceAudio(
  client: SupabaseClient,
  args: {
    conversationId: string;
    messageId: string;
    blob: Blob;
    mimeType?: string;
  }
): Promise<string> {
  if (args.blob.size < 512) {
    throw new Error('El audio grabado está vacío o es demasiado corto');
  }

  const ext = extensionForMime(args.mimeType);
  const path = `${args.conversationId}/${args.messageId}.${ext}`;
  const contentType = contentTypeForUpload(args.mimeType);

  const { error } = await client.storage
    .from(VOICE_STORAGE_BUCKET)
    .upload(path, args.blob, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    });

  if (error) {
    console.error('uploadVoiceAudio', error);
    throw new Error('No se pudo subir el audio');
  }

  const { data } = client.storage.from(VOICE_STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** URL firmada para reproducir (funciona aunque el bucket no sea público). */
export async function getVoiceAudioPlaybackUrl(
  client: SupabaseClient,
  audioUrl: string
): Promise<string> {
  const path = voiceStoragePathFromPublicUrl(audioUrl);
  if (!path) return audioUrl;

  const { data, error } = await client.storage
    .from(VOICE_STORAGE_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    console.warn('getVoiceAudioPlaybackUrl', error);
    return audioUrl;
  }
  return data.signedUrl;
}
