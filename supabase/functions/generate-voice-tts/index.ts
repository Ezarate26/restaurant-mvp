// @ts-types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, prefer, x-supabase-auth',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const BUCKET = 'voice-messages';

type TtsBody = { text?: string; language_code?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeLang(code: string | undefined): string {
  const c = (code ?? 'es').trim().slice(0, 2).toLowerCase();
  return c || 'es';
}

async function hashKey(text: string, lang: string): Promise<string> {
  const data = new TextEncoder().encode(`${lang}:${text}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
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

    let body: TtsBody;
    try {
      body = (await req.json()) as TtsBody;
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const text = body.text?.trim();
    const language_code = normalizeLang(body.language_code);
    if (!text) {
      return json({ error: 'text required' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: cached, error: cacheErr } = await admin
      .from('voice_tts_cache')
      .select('audio_url')
      .eq('text_content', text)
      .eq('language_code', language_code)
      .maybeSingle();

    if (cacheErr) {
      console.error('generate-voice-tts:cache lookup', cacheErr);
    }

    const cachedUrl = (cached?.audio_url as string | undefined)?.trim();
    if (cachedUrl) {
      return json({ audio_url: cachedUrl, cached: true });
    }

    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        response_format: 'mp3',
      }),
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      throw new Error(`OpenAI TTS error: ${errText}`);
    }

    const audioBytes = await ttsRes.arrayBuffer();
    const fileHash = await hashKey(text, language_code);
    const storagePath = `tts/${language_code}/${fileHash}.mp3`;

    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, audioBytes, {
        contentType: 'audio/mpeg',
        upsert: true,
        cacheControl: '31536000',
      });

    if (uploadErr) {
      throw new Error(`upload failed: ${uploadErr.message}`);
    }

    const { data: publicData } = admin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);
    const audio_url = publicData.publicUrl;

    const { error: insertErr } = await admin.from('voice_tts_cache').upsert(
      {
        text_content: text,
        language_code,
        audio_url,
      },
      { onConflict: 'text_content,language_code', ignoreDuplicates: false }
    );

    if (insertErr) {
      console.error('generate-voice-tts:cache insert', insertErr);
    }

    return json({ audio_url, cached: false });
  } catch (e) {
    console.error('generate-voice-tts', e);
    return json(
      { error: e instanceof Error ? e.message : 'TTS generation failed' },
      500
    );
  }
});
