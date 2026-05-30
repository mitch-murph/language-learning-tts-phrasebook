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
      const { text, languageCode = "en-AU", audioBase64, transcription, translation } = body as Record<string, string>;
      if (!text) throw new ValidationError("Missing text");
      if (!audioBase64) throw new ValidationError("Missing audioBase64");
      return save({ text, languageCode, audioBase64, transcription, translation });
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
