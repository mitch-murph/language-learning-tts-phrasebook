import { synthesize, uploadAudio } from '../tts';
import { savePhrase, listPhrases, deletePhrase } from '../phrases';

export class ValidationError extends Error {}

export async function handlePost(
  headers: Record<string, string | undefined>,
  rawBody: string,
  tableName: string,
  audioBucket: string,
) {
  const ttsUrl = headers["x-tts-url"];
  if (!ttsUrl) throw new ValidationError("Missing x-tts-url header");

  const { text, languageCode = "en-AU", save = false, transcription, translation } =
    JSON.parse(rawBody);
  if (!text) throw new ValidationError("Missing text");

  const audioBase64 = await synthesize(text, languageCode, ttsUrl);
  if (!save) return { audioBase64 };
  const s3Key = await uploadAudio(text, languageCode, audioBase64, audioBucket);
  const phrase = await savePhrase(tableName, text, languageCode, s3Key, transcription, translation);
  return { phraseId: phrase.phraseId, s3Key };
}

export async function handleGet(tableName: string) {
  return { phrases: await listPhrases(tableName) };
}

export async function handleDelete(tableName: string, phraseId: string) {
  await deletePhrase(tableName, phraseId);
  return { success: true };
}
