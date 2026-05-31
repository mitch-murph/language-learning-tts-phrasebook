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

// Reuses a single HTMLAudioElement across steps so iOS doesn't lose the user-gesture
// unlock between plays. Creating a new Audio() each time breaks drill mode on Safari/iOS.
function playOnEl(audio: HTMLAudioElement, url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const onEnded = () => { audio.removeEventListener('error', onError); resolve(); };
    const onError = () => { audio.removeEventListener('ended', onEnded); reject(new Error('audio playback failed')); };
    audio.addEventListener('ended', onEnded, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.src = url;
    audio.load();
    audio.play().catch(() => { /* surfaced via error event */ });
  });
}

function abortRace(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) { reject(new DOMException('aborted', 'AbortError')); return; }
    signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  });
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
  const audio = new Audio();

  const done = (async () => {
    const sequence = MODE_SEQUENCE[mode];
    for (let i = 0; i < sequence.length; i++) {
      if (controller.signal.aborted) return;
      const step = sequence[i];
      onStage?.({ index: i + 1, total: sequence.length, pace: step.pace });

      const base64 = await fetchAudio(text, lang, langName, step.pace);
      if (controller.signal.aborted) return;

      await Promise.race([playOnEl(audio, decodeToBlobUrl(base64)), abortRace(controller.signal)]);
      if (controller.signal.aborted) return;

      if (step.gapMs > 0 && i < sequence.length - 1) {
        await sleep(step.gapMs, controller.signal);
      }
    }
  })().catch(err => {
    if (err?.name !== 'AbortError') throw err;
  });

  return {
    done,
    stop: () => {
      controller.abort();
      audio.pause();
      audio.currentTime = 0;
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
  const audio = new Audio();
  const sequence = URL_MODE_SEQUENCE[mode];

  const done = (async () => {
    for (let i = 0; i < sequence.length; i++) {
      if (controller.signal.aborted) return;
      const step = sequence[i];
      const url = step.urlKey === 'normal' ? normalUrl : slowUrl;
      onStage?.({ index: i + 1, total: sequence.length, pace: step.urlKey });

      await Promise.race([playOnEl(audio, url), abortRace(controller.signal)]);
      if (controller.signal.aborted) return;

      if (step.gapMs > 0 && i < sequence.length - 1) {
        await sleep(step.gapMs, controller.signal);
      }
    }
  })().catch(err => {
    if (err?.name !== 'AbortError') throw err;
  });

  return {
    done,
    stop: () => {
      controller.abort();
      audio.pause();
      audio.currentTime = 0;
    },
  };
}
