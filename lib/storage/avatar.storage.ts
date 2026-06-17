import type { SupabaseClient } from '@supabase/supabase-js';
import { AVATAR_STORAGE_BUCKET } from '@/lib/model/profiles.repository';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function extensionForFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  const mime = file.type.toLowerCase();
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

export async function uploadUserAvatar(
  client: SupabaseClient,
  args: { userId: string; file: File }
): Promise<string> {
  if (args.file.size > MAX_AVATAR_BYTES) {
    throw new Error('La imagen es demasiado grande (máx. 5 MB)');
  }
  if (!args.file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen');
  }

  const ext = extensionForFile(args.file);
  const path = `${args.userId}/avatar.${ext}`;

  const { error } = await client.storage
    .from(AVATAR_STORAGE_BUCKET)
    .upload(path, args.file, {
      upsert: true,
      contentType: args.file.type || `image/${ext}`,
      cacheControl: '3600',
    });

  if (error) throw error;

  const { data } = client.storage.from(AVATAR_STORAGE_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;
  return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

export async function removeUserAvatar(
  client: SupabaseClient,
  publicUrl: string
): Promise<void> {
  const marker = `/storage/v1/object/public/${AVATAR_STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(
    publicUrl.slice(idx + marker.length).split('?')[0] ?? ''
  );
  if (!path) return;
  await client.storage.from(AVATAR_STORAGE_BUCKET).remove([path]);
}
