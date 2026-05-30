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
      const audioBase64 = b.audioBase64 as string | undefined;
      const transcription = b.transcription as string | undefined;
      const translation = b.translation as string | undefined;
      if (!text) throw new ValidationError("Missing text");
      if (!languageName) throw new ValidationError("Missing languageName");
      if (typeof nonLatin !== "boolean") throw new ValidationError("Missing nonLatin");
      if (!audioBase64) throw new ValidationError("Missing audioBase64");
      return save({ text, languageCode, languageName, nonLatin, audioBase64, transcription, translation });
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
      const { transcription, translation } = body as Record<string, string>;
      return update({ phraseId, transcription, translation });
    },
  };
}
