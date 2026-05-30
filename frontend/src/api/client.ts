import { generateToken } from './crypto';

const LAMBDA_URL = (import.meta.env.VITE_LAMBDA_URL ?? '').replace(/\/$/, '');
const AUDIO_BASE_URL = (import.meta.env.VITE_AUDIO_BASE_URL ?? '').replace(/\/$/, '');

export interface Phrase {
  phraseId: string;
  text: string;
  languageCode: string;
  languageName: string;
  nonLatin: boolean;
  normalS3Key: string;
  slowS3Key: string;
  createdAt: string;
  updatedAt?: string;
  transcription?: string;
  translation?: string;
}

export function getAudioUrl(s3Key: string): string {
  return `${AUDIO_BASE_URL}/${s3Key}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  return {
    'Content-Type': 'application/json',
    'x-app-token': await generateToken(),
  };
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return (body && (body.error as string)) || `HTTP ${res.status}`;
}

export async function savePhrase(args: {
  text: string;
  languageCode: string;
  languageName: string;
  nonLatin: boolean;
  normalAudioBase64: string;
  slowAudioBase64: string;
  transcription?: string;
  translation?: string;
}): Promise<Phrase> {
  const res = await fetch(`${LAMBDA_URL}/phrases`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function listPhrases(): Promise<Phrase[]> {
  const res = await fetch(`${LAMBDA_URL}/phrases`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(await readError(res));
  const { phrases } = await res.json();
  return phrases as Phrase[];
}

export async function updatePhrase(
  phraseId: string,
  fields: { transcription?: string; translation?: string },
): Promise<Phrase> {
  const res = await fetch(`${LAMBDA_URL}/phrases/${phraseId}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function deletePhrase(phraseId: string): Promise<void> {
  const res = await fetch(`${LAMBDA_URL}/phrases/${phraseId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await readError(res));
}
