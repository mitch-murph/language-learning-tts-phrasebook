export type Pace = 'slow' | 'normal';

const PROMPTS: Record<Pace, string> = {
  slow: 'Speak like a calm language tutor. Read the phrase slowly and clearly so a learner can hear every syllable.',
  normal: 'Read this phrase naturally, at a normal conversational pace.',
};

export class TtsError extends Error {
  constructor(message: string, public unsupportedLanguage: boolean) {
    super(message);
    this.name = 'TtsError';
  }
}

/**
 * Calls the Google TTS proxy directly from the browser. The user's proxy URL
 * (with short-lived OAuth2 token) is stored in localStorage via Settings.
 * Returns base64-encoded MP3 audio.
 */
export async function callTts(text: string, languageCode: string, pace: Pace = 'slow'): Promise<string> {
  const ttsUrl = localStorage.getItem('ttsUrl') ?? '';
  if (!ttsUrl) throw new TtsError('TTS URL not set — open Settings and paste the proxy URL.', false);
  const res = await fetch(ttsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({
      input: { text, prompt: PROMPTS[pace] },
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
