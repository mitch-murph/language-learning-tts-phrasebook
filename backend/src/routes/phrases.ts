import type { SynthesizePhraseUseCase } from "../usecases/synthesizePhrase";
import type { SavePhraseUseCase } from "../usecases/savePhrase";
import type { ListPhrasesUseCase } from "../usecases/listPhrases";
import type { DeletePhraseUseCase } from "../usecases/deletePhrase";

export class ValidationError extends Error {}

export class PhrasesRoute {
  constructor(
    private synthesize: SynthesizePhraseUseCase,
    private save: SavePhraseUseCase,
    private list: ListPhrasesUseCase,
    private delete_: DeletePhraseUseCase
  ) {}

  async handlePost(headers: Record<string, string | undefined>, rawBody: string) {
    const ttsUrl = headers["x-tts-url"];
    if (!ttsUrl) throw new ValidationError("Missing x-tts-url header");

    const { text, languageCode = "en-AU", save = false, transcription, translation } =
      JSON.parse(rawBody);
    if (!text) throw new ValidationError("Missing text");

    if (!save) return this.synthesize.execute({ text, languageCode, ttsUrl });
    return this.save.execute({ text, languageCode, ttsUrl, transcription, translation });
  }

  async handleGet() {
    return this.list.execute();
  }

  async handleDelete(phraseId: string) {
    return this.delete_.execute(phraseId);
  }
}
