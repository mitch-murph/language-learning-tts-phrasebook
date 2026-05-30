import { generateToken } from './crypto';

const LAMBDA_URL = (import.meta.env.VITE_LAMBDA_URL ?? '').replace(/\/$/, '');
const AUDIO_BASE_URL = (import.meta.env.VITE_AUDIO_BASE_URL ?? '').replace(/\/$/, '');

export function getAudioUrl(s3Key: string): string {
  const base = localStorage.getItem('audioBaseUrl') || AUDIO_BASE_URL;
  return `${base}/${s3Key}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  return {
    'Content-Type': 'application/json',
    'x-app-token': await generateToken(),
  };
}

export async function callTts(text: string, languageCode: string): Promise<string> {
  const ttsUrl = localStorage.getItem('ttsUrl') ?? '';
  if (!ttsUrl) throw new Error('TTS URL not set — open Settings and paste the proxy URL.');
  const res = await fetch(ttsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({
      input: { text, prompt: 'Speak like a calm language tutor. Read the phrase slowly and clearly.' },
      voice: { languageCode, name: 'Charon', modelName: 'gemini-3.1-flash-tts-preview' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1 },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  const { audioContent } = await res.json();
  return audioContent;
}

export interface Phrase {
  phraseId: string;
  text: string;
  languageCode: string;
  s3Key: string;
  createdAt: string;
  transcription?: string;
  translation?: string;
}

export async function savePhrase(
  text: string,
  languageCode: string,
  audioBase64: string,
  transcription?: string,
  translation?: string
): Promise<{ phraseId: string; s3Key: string }> {
  const res = await fetch(`${LAMBDA_URL}/phrases`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ text, languageCode, audioBase64, transcription, translation }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(error);
  }
  return res.json();
}

export async function listPhrases(): Promise<Phrase[]> {
  const res = await fetch(`${LAMBDA_URL}/phrases`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { phrases } = await res.json();
  return phrases;
}

export async function deletePhrase(phraseId: string): Promise<void> {
  const res = await fetch(`${LAMBDA_URL}/phrases/${phraseId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
