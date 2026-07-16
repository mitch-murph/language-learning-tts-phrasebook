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
  translationAudioBase64?: string;
  tags?: string[];
  hide?: boolean;
}

export type SavePhraseFn = (userId: string, input: SavePhraseInput) => Promise<Phrase>;

export function makeSavePhrase(audio: IAudioStore, repo: IPhraseRepository): SavePhraseFn {
  return async (userId, input) => {
    console.log(`[save] uploading to s3: "${input.text}" (${input.languageCode})`);
    const uploads: Promise<string>[] = [
      audio.upload(input.text, input.languageCode, input.normalAudioBase64, "normal"),
      audio.upload(input.text, input.languageCode, input.slowAudioBase64, "slow"),
    ];
    if (input.translation && input.translationAudioBase64) {
      uploads.push(audio.upload(input.translation, "en-US", input.translationAudioBase64, "translation"));
    }
    const [normalS3Key, slowS3Key, translationS3Key] = await Promise.all(uploads);

    console.log("[save] writing to db:", normalS3Key, slowS3Key);
    const phrase = await repo.save(userId, {
      text: input.text,
      languageCode: input.languageCode,
      languageName: input.languageName,
      nonLatin: input.nonLatin,
      normalS3Key,
      slowS3Key,
      transcription: input.transcription,
      translation: input.translation,
      translationS3Key,
      tags: input.tags,
      hide: input.hide,
    });

    console.log("[save] done:", phrase.phraseId);
    return phrase;
  };
}
