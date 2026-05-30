import type { SavePhraseUseCase } from "../usecases/savePhrase";
import type { ListPhrasesUseCase } from "../usecases/listPhrases";
import type { DeletePhraseUseCase } from "../usecases/deletePhrase";

export class ValidationError extends Error {}

export class PhrasesRoute {
  constructor(
    private save: SavePhraseUseCase,
    private list: ListPhrasesUseCase,
    private delete_: DeletePhraseUseCase
  ) {}

  async handlePost(rawBody: string) {
    const { text, languageCode = "en-AU", audioBase64, transcription, translation } =
      JSON.parse(rawBody);
    if (!text) throw new ValidationError("Missing text");
    if (!audioBase64) throw new ValidationError("Missing audioBase64");
    return this.save.execute({ text, languageCode, audioBase64, transcription, translation });
  }

  async handleGet() {
    return this.list.execute();
  }

  async handleDelete(phraseId: string) {
    return this.delete_.execute(phraseId);
  }
}
