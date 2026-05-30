import type { ITtsService } from "../services/ttsService";
import type { IAudioStore } from "../services/audioStore";
import type { IPhraseRepository } from "../repositories/phraseRepository";

export interface SavePhraseInput {
  text: string;
  languageCode: string;
  ttsUrl: string;
  transcription?: string;
  translation?: string;
}

export class SavePhraseUseCase {
  constructor(
    private tts: ITtsService,
    private audio: IAudioStore,
    private repo: IPhraseRepository
  ) {}

  async execute(input: SavePhraseInput): Promise<{ phraseId: string; s3Key: string }> {
    const audioBase64 = await this.tts.synthesize(input.text, input.languageCode, input.ttsUrl);
    const s3Key = await this.audio.upload(input.text, input.languageCode, audioBase64);
    const phrase = await this.repo.save({
      text: input.text,
      languageCode: input.languageCode,
      s3Key,
      transcription: input.transcription,
      translation: input.translation,
    });
    return { phraseId: phrase.phraseId, s3Key };
  }
}
