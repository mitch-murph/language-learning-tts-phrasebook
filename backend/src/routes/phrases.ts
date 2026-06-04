import type { SavePhraseFn } from "../usecases/savePhrase";
import type { ListPhrasesFn } from "../usecases/listPhrases";
import type { DeletePhraseFn } from "../usecases/deletePhrase";
import type { UpdatePhraseFn } from "../usecases/updatePhrase";

export class ValidationError extends Error {}

export function makePhrasesRoute(save: SavePhraseFn, list: ListPhrasesFn, delete_: DeletePhraseFn, update: UpdatePhraseFn) {
  return {
    async handlePost(rawBody: string) {
      let body: unknown;
      try { body = JSON.parse(rawBody); } catch { throw new ValidationError("Invalid JSON"); }
      const b = body as Record<string, unknown>;
      const text = b.text as string | undefined;
      const languageCode = (b.languageCode as string | undefined) ?? "en-AU";
      const languageName = b.languageName as string | undefined;
      const nonLatin = b.nonLatin;
      const normalAudioBase64 = b.normalAudioBase64 as string | undefined;
      const slowAudioBase64 = b.slowAudioBase64 as string | undefined;
      const transcription = b.transcription as string | undefined;
      const translation = b.translation as string | undefined;
      const tags = Array.isArray(b.tags) ? (b.tags as string[]).filter(t => typeof t === "string") : undefined;
      if (!text) throw new ValidationError("Missing text");
      if (!languageName) throw new ValidationError("Missing languageName");
      if (typeof nonLatin !== "boolean") throw new ValidationError("Missing nonLatin");
      if (!normalAudioBase64) throw new ValidationError("Missing normalAudioBase64");
      if (!slowAudioBase64) throw new ValidationError("Missing slowAudioBase64");
      const translationAudioBase64 = b.translationAudioBase64 as string | undefined;
      return save({ text, languageCode, languageName, nonLatin, normalAudioBase64, slowAudioBase64, transcription, translation, translationAudioBase64, tags });
    },
    async handleGet() {
      return list();
    },
    async handleDelete(phraseId: string) {
      return delete_(phraseId);
    },
    async handlePut(phraseId: string, rawBody: string) {
      let body: unknown;
      try { body = JSON.parse(rawBody); } catch { throw new ValidationError("Invalid JSON"); }
      const b = body as Record<string, unknown>;
      const transcription = b.transcription as string | undefined;
      const translation = b.translation as string | undefined;
      const translationAudioBase64 = b.translationAudioBase64 as string | undefined;
      const tags = Array.isArray(b.tags) ? (b.tags as string[]).filter(t => typeof t === "string") : undefined;
      return update({ phraseId, transcription, translation, translationAudioBase64, tags });
    },
  };
}
