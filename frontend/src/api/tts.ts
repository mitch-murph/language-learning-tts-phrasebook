import { getPrompt } from './settings';

export type Pace = 'slow' | 'normal';

export class TtsError extends Error {
  constructor(message: string, public unsupportedLanguage: boolean) {
    super(message);
    this.name = 'TtsError';
  }
}

export async function callTts(
  text: string,
  languageCode: string,
  pace: Pace = 'slow',
  languageName = '',
  overridePrompt?: string,
): Promise<string> {
  const ttsUrl = localStorage.getItem('ttsUrl') ?? '';
  if (!ttsUrl) throw new TtsError('TTS URL not set. Open Settings and paste the proxy URL.', false);
  const res = await fetch(ttsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({
      input: { text, prompt: overridePrompt ?? getPrompt(pace, languageName) },
      voice: { languageCode, name: 'Charon', modelName: 'gemini-3.1-flash-tts-preview' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1 },
    }),
  });
  if (!res.ok) {
    const raw = await res.text();
    let message = `TTS ${res.status}: ${raw}`;
    let unsupported = false;
    try {
      const parsed = JSON.parse(raw);
      const inner = parsed?.error?.message;
      if (typeof inner === 'string' && inner.length) message = inner;
      if (res.status === 400 && /language code.*not supported/i.test(inner ?? '')) {
        unsupported = true;
      }
    } catch { /* keep fallback message */ }
    throw new TtsError(message, unsupported);
  }
  const { audioContent } = await res.json();
  return audioContent as string;
}
