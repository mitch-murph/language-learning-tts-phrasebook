import type { SavePhraseFn } from "../usecases/savePhrase";
import type { ListPhrasesFn } from "../usecases/listPhrases";
import type { DeletePhraseFn } from "../usecases/deletePhrase";

export class ValidationError extends Error {}

export function makePhrasesRoute(save: SavePhraseFn, list: ListPhrasesFn, delete_: DeletePhraseFn) {
  return {
    async handlePost(rawBody: string) {
      const { text, languageCode = "en-AU", audioBase64, transcription, translation } = JSON.parse(rawBody);
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
  };
}
