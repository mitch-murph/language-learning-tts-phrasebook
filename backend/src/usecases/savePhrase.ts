import type { IAudioStore } from "../services/audioStore";
import type { IPhraseRepository } from "../repositories/phraseRepository";
import type { Phrase } from "../domain";

export interface SavePhraseInput {
  text: string;
  languageCode: string;
  languageName: string;
  nonLatin: boolean;
  normalAudioBase64: string;
  slowAudioBase64: string;
  transcription?: string;
  translation?: string;
}

export type SavePhraseFn = (input: SavePhraseInput) => Promise<Phrase>;

export function makeSavePhrase(audio: IAudioStore, repo: IPhraseRepository): SavePhraseFn {
  return async (input) => {
    console.log(`[save] uploading to s3: "${input.text}" (${input.languageCode})`);
    const [normalS3Key, slowS3Key] = await Promise.all([
      audio.upload(input.text, input.languageCode, input.normalAudioBase64, "normal"),
      audio.upload(input.text, input.languageCode, input.slowAudioBase64, "slow"),
    ]);

    console.log("[save] writing to db:", normalS3Key, slowS3Key);
    const phrase = await repo.save({
      text: input.text,
      languageCode: input.languageCode,
      languageName: input.languageName,
      nonLatin: input.nonLatin,
      normalS3Key,
      slowS3Key,
      transcription: input.transcription,
      translation: input.translation,
    });

    console.log("[save] done:", phrase.phraseId);
    return phrase;
  };
}
