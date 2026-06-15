'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { convertBlobToWav } from '@/lib/audio/wav-encoder';

const MIN_BLOB_BYTES = 1024;
const MIN_DURATION_MS = 800;
const WAVEFORM_BARS = 28;
const MIC_ACTIVE_THRESHOLD = 0.018;

function getUserMedia(): typeof navigator.mediaDevices.getUserMedia | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ?? null;
}

function createAudioContext(): AudioContext {
  const Ctx =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      : undefined;
  if (!Ctx) throw new Error('Web Audio API no disponible');
  return new Ctx();
}

async function resumeAudioContext(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  if (ctx.state !== 'running') {
    await ctx.resume();
  }
}

/** Intenta varias configs: algunas PCs fallan con sampleRate fijo o AGC agresivo. */
async function acquireMicrophoneStream(): Promise<MediaStream> {
  const requestMic = getUserMedia();
  if (!requestMic) {
    // getUserMedia solo existe en contextos seguros (HTTPS o localhost).
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext
    ) {
      throw new Error(
        'El micrófono requiere una conexión segura (HTTPS). Abre la app con https:// o desde localhost.'
      );
    }
    throw new Error('Tu navegador no soporta grabación de audio');
  }

  const attempts: MediaStreamConstraints[] = [
    {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    },
    {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    },
    { audio: true },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      const stream = await requestMic(constraints);
      const track = stream.getAudioTracks()[0];
      if (track?.readyState === 'live') {
        track.enabled = true;
        return stream;
      }
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('No se pudo abrir el micrófono');
}

function pickRecorderMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return 'audio/webm';
}

function emptyWaveform(): number[] {
  return Array.from({ length: WAVEFORM_BARS }, () => 0.08);
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(emptyWaveform);
  const [durationMs, setDurationMs] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAnalyserLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const teardownAudioGraph = useCallback(async () => {
    stopAnalyserLoop();
    analyserRef.current = null;
    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx && ctx.state !== 'closed') {
      await ctx.close().catch(() => undefined);
    }
  }, [stopAnalyserLoop]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startAnalyserLoop = useCallback(
    (analyser: AnalyserNode, stream: MediaStream) => {
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.35;
      const timeData = new Uint8Array(analyser.fftSize);
      const track = stream.getAudioTracks()[0];

      const tick = () => {
        if (track) {
          setMicMuted(track.muted || !track.enabled);
        }

        analyser.getByteTimeDomainData(timeData);
        const sliceSize = Math.floor(timeData.length / WAVEFORM_BARS);
        const bars: number[] = [];
        let totalRms = 0;

        for (let i = 0; i < WAVEFORM_BARS; i++) {
          let sumSquares = 0;
          const start = i * sliceSize;
          const end = start + sliceSize;
          for (let j = start; j < end; j++) {
            const sample = ((timeData[j] ?? 128) - 128) / 128;
            sumSquares += sample * sample;
          }
          const rms = Math.sqrt(sumSquares / sliceSize);
          totalRms += rms;
          bars.push(Math.max(0.08, Math.min(1, rms * 5.5)));
        }

        const level = totalRms / WAVEFORM_BARS;
        setWaveformLevels(bars);
        setMicActive(level > MIC_ACTIVE_THRESHOLD);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      timerRef.current = setInterval(() => {
        const started = startedAtRef.current;
        if (started) setDurationMs(Date.now() - started);
      }, 100);
    },
    []
  );

  const setupAudioMonitor = useCallback(
    async (stream: MediaStream) => {
      const audioContext = createAudioContext();
      audioContextRef.current = audioContext;
      await resumeAudioContext(audioContext);

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0.0001;

      source.connect(analyser);
      analyser.connect(silentGain);
      silentGain.connect(audioContext.destination);

      analyserRef.current = analyser;
      startAnalyserLoop(analyser, stream);

      await resumeAudioContext(audioContext);
    },
    [startAnalyserLoop]
  );

  const startRecording = useCallback(async () => {
    setError(null);
    setDurationMs(0);
    setWaveformLevels(emptyWaveform());
    setMicActive(false);
    setMicMuted(false);

    try {
      const stream = await acquireMicrophoneStream();
      streamRef.current = stream;
      chunksRef.current = [];

      await setupAudioMonitor(stream);

      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128_000,
      });
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      setIsRecording(true);
      return true;
    } catch (e) {
      console.error('useVoiceRecorder:start', e);
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo acceder al micrófono. Revisa permisos.'
      );
      stopStream();
      await teardownAudioGraph();
      return false;
    }
  }, [setupAudioMonitor, stopStream, teardownAudioGraph]);

  const finalizeBlob = useCallback(
    async (
      rawBlob: Blob,
      durationSeconds: number
    ): Promise<{ blob: Blob; mimeType: string; durationSeconds: number } | null> => {
      if (durationSeconds * 1000 < MIN_DURATION_MS) {
        setError(`Graba al menos ${MIN_DURATION_MS / 1000} segundos.`);
        return null;
      }
      if (rawBlob.size < MIN_BLOB_BYTES) {
        setError('No se captó audio. Habla más cerca del micrófono.');
        return null;
      }

      try {
        const wavBlob = await convertBlobToWav(rawBlob);
        if (wavBlob.size < MIN_BLOB_BYTES) {
          setError('No se captó audio. Habla más cerca del micrófono.');
          return null;
        }
        return { blob: wavBlob, mimeType: 'audio/wav', durationSeconds };
      } catch (e) {
        console.warn('useVoiceRecorder:wav-fallback', e);
        return {
          blob: rawBlob,
          mimeType: rawBlob.type || 'audio/webm',
          durationSeconds,
        };
      }
    },
    []
  );

  const stopRecording = useCallback(async (): Promise<{
    blob: Blob;
    mimeType: string;
    durationSeconds: number;
  } | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setIsRecording(false);
      stopStream();
      await teardownAudioGraph();
      setError('No hay grabación activa');
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        void (async () => {
          const started = startedAtRef.current ?? Date.now();
          const durationSeconds = Math.max(
            1,
            Math.round((Date.now() - started) / 1000)
          );
          const rawBlob = new Blob(chunksRef.current, {
            type: recorder.mimeType || pickRecorderMimeType(),
          });

          chunksRef.current = [];
          mediaRecorderRef.current = null;
          startedAtRef.current = null;
          setIsRecording(false);
          setDurationMs(0);
          setWaveformLevels(emptyWaveform());
          setMicActive(false);
          setMicMuted(false);
          stopStream();
          await teardownAudioGraph();

          const result = await finalizeBlob(rawBlob, durationSeconds);
          resolve(result);
        })();
      };

      try {
        if (recorder.state === 'recording') recorder.requestData();
        recorder.stop();
      } catch (e) {
        console.error('useVoiceRecorder:stop', e);
        setIsRecording(false);
        stopStream();
        void teardownAudioGraph();
        setError('No se pudo finalizar la grabación');
        resolve(null);
      }
    });
  }, [finalizeBlob, stopStream, teardownAudioGraph]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        startedAtRef.current = null;
        setIsRecording(false);
        setDurationMs(0);
        setWaveformLevels(emptyWaveform());
        setMicActive(false);
        setMicMuted(false);
        stopStream();
        void teardownAudioGraph();
      };
      try {
        recorder.stop();
      } catch {
        setIsRecording(false);
        stopStream();
        void teardownAudioGraph();
      }
    } else {
      setIsRecording(false);
      setDurationMs(0);
      stopStream();
      void teardownAudioGraph();
    }
  }, [stopStream, teardownAudioGraph]);

  useEffect(() => {
    return () => {
      stopStream();
      void teardownAudioGraph();
    };
  }, [stopStream, teardownAudioGraph]);

  const canSendRecording = durationMs >= MIN_DURATION_MS;

  return {
    isRecording,
    error,
    waveformLevels,
    durationMs,
    micActive,
    micMuted,
    canSendRecording,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
