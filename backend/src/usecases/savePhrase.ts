import type { IAudioStore } from "../services/audioStore";
import type { IPhraseRepository } from "../repositories/phraseRepository";

export interface SavePhraseInput {
  text: string;
  languageCode: string;
  audioBase64: string;
  transcription?: string;
  translation?: string;
}

export type SavePhraseFn = (input: SavePhraseInput) => Promise<{ phraseId: string; s3Key: string }>;

export function makeSavePhrase(audio: IAudioStore, repo: IPhraseRepository): SavePhraseFn {
  return async (input) => {
    console.log(`[save] uploading to s3: "${input.text}" (${input.languageCode})`);
    const s3Key = await audio.upload(input.text, input.languageCode, input.audioBase64);

    console.log("[save] writing to db:", s3Key);
    const phrase = await repo.save({
      text: input.text,
      languageCode: input.languageCode,
      s3Key,
      transcription: input.transcription,
      translation: input.translation,
    });

    console.log("[save] done:", phrase.phraseId);
    return { phraseId: phrase.phraseId, s3Key };
  };
}
