import type { IAudioStore } from "../services/audioStore";
import type { IPhraseRepository } from "../repositories/phraseRepository";
import type { Phrase } from "../domain";

export interface UpdatePhraseInput {
  phraseId: string;
  transcription?: string;
  translation?: string;
  translationAudioBase64?: string;
  tags?: string[];
}

export type UpdatePhraseFn = (input: UpdatePhraseInput) => Promise<Phrase>;

export function makeUpdatePhrase(audio: IAudioStore, repo: IPhraseRepository): UpdatePhraseFn {
  return async ({ phraseId, transcription, translation, translationAudioBase64, tags }) => {
    let translationS3Key: string | undefined;
    if (translation && translationAudioBase64) {
      translationS3Key = await audio.upload(translation, "en-US", translationAudioBase64, "translation");
    }
    return repo.update(phraseId, { transcription, translation, translationS3Key, tags });
  };
}
