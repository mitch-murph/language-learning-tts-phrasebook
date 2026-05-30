import { callTts, type Pace } from '../api/tts';
import { getPrompt } from '../api/settings';

export type Mode = 'normal' | 'slow' | 'drill';

interface SequenceStep { pace: Pace; gapMs: number; }

const MODE_SEQUENCE: Record<Mode, SequenceStep[]> = {
  normal: [{ pace: 'normal', gapMs: 0 }],
  slow:   [{ pace: 'slow',   gapMs: 0 }],
  drill:  [
    { pace: 'normal', gapMs: 2000 },
    { pace: 'slow',   gapMs: 2000 },
    { pace: 'normal', gapMs: 0 },
  ],
};

const audioCache = new Map<string, string>();
const blobUrlByBase64 = new Map<string, string>();

function decodeToBlobUrl(base64: string): string {
  const cached = blobUrlByBase64.get(base64);
  if (cached) return cached;
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
  blobUrlByBase64.set(base64, url);
  return url;
}

async function fetchAudio(text: string, lang: string, langName: string, pace: Pace): Promise<string> {
  const prompt = getPrompt(pace, langName);
  const key = `${lang}|${pace}|${prompt}|${text}`;
  const hit = audioCache.get(key);
  if (hit) return hit;
  const audio = await callTts(text, lang, pace, langName);
  audioCache.set(key, audio);
  return audio;
}

function playUrl(url: string): { audio: HTMLAudioElement; ended: Promise<void> } {
  const audio = new Audio(url);
  const ended = new Promise<void>((resolve, reject) => {
    audio.addEventListener('ended', () => resolve(), { once: true });
    audio.addEventListener('error', () => reject(new Error('audio playback failed')), { once: true });
  });
  audio.play().catch(() => { /* surfaced via error event */ });
  return { audio, ended };
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('aborted', 'AbortError'));
    const t = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException('aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export interface PlayController {
  stop: () => void;
  done: Promise<void>;
}

export interface PlayStage { index: number; total: number; pace: Pace; }

export function playPhrase(opts: {
  text: string;
  lang: string;
  langName: string;
  mode: Mode;
  onStage?: (stage: PlayStage) => void;
}): PlayController {
  const { text, lang, langName, mode, onStage } = opts;
  const controller = new AbortController();
  let currentAudio: HTMLAudioElement | null = null;

  const done = (async () => {
    const sequence = MODE_SEQUENCE[mode];
    const loop = false;
    let iteration = 0;

    while (true) {
      for (let i = 0; i < sequence.length; i++) {
        if (controller.signal.aborted) return;
        const step = sequence[i];
        onStage?.({
          index: loop ? iteration + 1 : i + 1,
          total: loop ? 0 : sequence.length,
          pace: step.pace,
        });

        const base64 = await fetchAudio(text, lang, langName, step.pace);
        if (controller.signal.aborted) return;
        const url = decodeToBlobUrl(base64);
        const { audio, ended } = playUrl(url);
        currentAudio = audio;
        try {
          await Promise.race([
            ended,
            new Promise<void>((_, reject) => {
              controller.signal.addEventListener(
                'abort',
                () => reject(new DOMException('aborted', 'AbortError')),
                { once: true },
              );
            }),
          ]);
        } finally {
          currentAudio = null;
        }

        if (controller.signal.aborted) return;
        if (step.gapMs > 0 && (loop || i < sequence.length - 1)) {
          try { await sleep(step.gapMs, controller.signal); } catch { return; }
        }
      }
      if (!loop) break;
      iteration++;
    }
  })().catch(err => {
    if (err?.name !== 'AbortError') throw err;
  });

  return {
    done,
    stop: () => {
      controller.abort();
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    },
  };
}

interface UrlStep { urlKey: 'normal' | 'slow'; gapMs: number; }

const URL_MODE_SEQUENCE: Record<Mode, UrlStep[]> = {
  normal: [{ urlKey: 'normal', gapMs: 0 }],
  slow:   [{ urlKey: 'slow',   gapMs: 0 }],
  drill:  [
    { urlKey: 'normal', gapMs: 2000 },
    { urlKey: 'slow',   gapMs: 2000 },
    { urlKey: 'normal', gapMs: 0 },
  ],
};

export function playPhraseFromUrls(opts: {
  normalUrl: string;
  slowUrl: string;
  mode: Mode;
  onStage?: (stage: PlayStage) => void;
}): PlayController {
  const { normalUrl, slowUrl, mode, onStage } = opts;
  const controller = new AbortController();
  let currentAudio: HTMLAudioElement | null = null;

  const sequence = URL_MODE_SEQUENCE[mode];

  const done = (async () => {
    for (let i = 0; i < sequence.length; i++) {
      if (controller.signal.aborted) return;
      const step = sequence[i];
      const url = step.urlKey === 'normal' ? normalUrl : slowUrl;

      onStage?.({ index: i + 1, total: sequence.length, pace: step.urlKey });

      const { audio, ended } = playUrl(url);
      currentAudio = audio;
      try {
        await Promise.race([
          ended,
          new Promise<void>((_, reject) => {
            controller.signal.addEventListener(
              'abort',
              () => reject(new DOMException('aborted', 'AbortError')),
              { once: true },
            );
          }),
        ]);
      } finally {
        currentAudio = null;
      }

      if (controller.signal.aborted) return;
      if (step.gapMs > 0 && i < sequence.length - 1) {
        try { await sleep(step.gapMs, controller.signal); } catch { return; }
      }
    }
  })().catch(err => {
    if (err?.name !== 'AbortError') throw err;
  });

  return {
    done,
    stop: () => {
      controller.abort();
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    },
  };
}
