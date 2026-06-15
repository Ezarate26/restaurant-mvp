// @ts-types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, prefer, x-supabase-auth',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

type ProcessBody = { message_id?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function storagePathFromPublicUrl(
  publicUrl: string,
  bucket: string
): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      return json({ error: 'OPENAI_API_KEY not configured' }, 500);
    }

    let body: ProcessBody;
    try {
      body = (await req.json()) as ProcessBody;
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const messageId = body.message_id?.trim();
    if (!messageId) {
      return json({ error: 'message_id required' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: voiceRow, error: voiceErr } = await admin
      .from('voice_messages')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (voiceErr || !voiceRow) {
      return json({ error: 'voice_message not found' }, 404);
    }

    const { data: messageRow, error: msgErr } = await admin
      .from('messages')
      .select('id, conversation_id, member_id, message_type')
      .eq('id', messageId)
      .single();

    if (msgErr || !messageRow) {
      return json({ error: 'message not found' }, 404);
    }

    await admin
      .from('voice_messages')
      .update({ processing_status: 'processing' })
      .eq('id', voiceRow.id);

    const audioUrl = voiceRow.audio_url as string;
    const bucket = 'voice-messages';
    const storagePath = storagePathFromPublicUrl(audioUrl, bucket);

    let audioBytes: ArrayBuffer;
    if (storagePath) {
      const { data: fileData, error: dlErr } = await admin.storage
        .from(bucket)
        .download(storagePath);
      if (dlErr || !fileData) {
        throw new Error(`download failed: ${dlErr?.message ?? 'no data'}`);
      }
      audioBytes = await fileData.arrayBuffer();
    } else {
      const res = await fetch(audioUrl);
      if (!res.ok) throw new Error(`fetch audio failed: ${res.status}`);
      audioBytes = await res.arrayBuffer();
    }

    const ext = storagePath?.split('.').pop()?.toLowerCase() ?? 'wav';
    const mime =
      ext === 'wav'
        ? 'audio/wav'
        : ext === 'ogg'
          ? 'audio/ogg'
          : ext === 'mp3'
            ? 'audio/mpeg'
            : ext === 'm4a' || ext === 'mp4'
              ? 'audio/mp4'
              : 'audio/webm';

    const form = new FormData();
    form.append('file', new Blob([audioBytes], { type: mime }), `audio.${ext}`);
    form.append('model', 'whisper-1');
    form.append('response_format', 'json');

    const whisperRes = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: form,
      }
    );

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      throw new Error(`Whisper error: ${errText}`);
    }

    const whisperJson = (await whisperRes.json()) as {
      text?: string;
      language?: string;
    };
    const transcription = (whisperJson.text ?? '').trim();
    const detectedLang = (
      whisperJson.language ??
      voiceRow.original_language ??
      'es'
    )
      .slice(0, 2)
      .toLowerCase();

    const now = new Date().toISOString();

    await admin
      .from('voice_messages')
      .update({
        transcription,
        transcription_status: transcription ? 'completed' : 'failed',
        processing_status: 'completed',
        transcription_completed_at: now,
        original_language: detectedLang,
      })
      .eq('id', voiceRow.id);

    await admin
      .from('messages')
      .update({
        content: transcription || null,
        original_language: detectedLang,
        translation_status: transcription ? 'pending' : 'failed',
      })
      .eq('id', messageId);

    if (transcription) {
      const conversationId = messageRow.conversation_id as string;
      const { data: memberRows } = await admin
        .from('conversation_members')
        .select('preferred_language')
        .eq('conversation_id', conversationId)
        .is('left_at', null);

      const orig = detectedLang;
      const targets = [
        ...new Set(
          (memberRows ?? [])
            .map((m) =>
              (m.preferred_language as string | null)
                ?.trim()
                .slice(0, 2)
                .toLowerCase()
            )
            .filter((l): l is string => Boolean(l && l !== orig))
        ),
      ];

      for (const targetLang of targets) {
        const { data: cached } = await admin
          .from('translation_cache')
          .select('translated_text')
          .eq('source_text', transcription)
          .eq('source_language', orig)
          .eq('target_language', targetLang)
          .maybeSingle();

        let translated = cached?.translated_text as string | undefined;

        if (!translated) {
          const { data: trData, error: trErr } = await admin.functions.invoke(
            'translate-message',
            { body: { text: transcription, from: orig, to: targetLang } }
          );
          if (
            !trErr &&
            trData &&
            typeof trData === 'object' &&
            trData !== null
          ) {
            const t = (trData as { translation?: string }).translation?.trim();
            if (t) translated = t;
          }
        }

        if (translated) {
          await admin.from('message_translations').upsert(
            {
              message_id: messageId,
              language_code: targetLang,
              translated_content: translated,
            },
            { onConflict: 'message_id,language_code', ignoreDuplicates: true }
          );
        }
      }

      await admin
        .from('messages')
        .update({ translation_status: 'completed' })
        .eq('id', messageId);
    }

    return json({ ok: true, message_id: messageId, transcription });
  } catch (e) {
    console.error('process-voice-message', e);
    return json(
      { error: e instanceof Error ? e.message : 'processing failed' },
      500
    );
  }
});
