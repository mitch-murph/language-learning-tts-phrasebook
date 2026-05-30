import type { ITtsService } from "../services/ttsService";

export interface SynthesizePhraseInput {
  text: string;
  languageCode: string;
  ttsUrl: string;
}

export class SynthesizePhraseUseCase {
  constructor(private tts: ITtsService) {}

  async execute(input: SynthesizePhraseInput): Promise<{ audioBase64: string }> {
    const audioBase64 = await this.tts.synthesize(input.text, input.languageCode, input.ttsUrl);
    return { audioBase64 };
  }
}
