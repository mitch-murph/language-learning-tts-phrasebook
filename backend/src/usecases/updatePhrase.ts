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

export type UpdatePhraseFn = (userId: string, input: UpdatePhraseInput) => Promise<Phrase>;

export function makeUpdatePhrase(audio: IAudioStore, repo: IPhraseRepository): UpdatePhraseFn {
  return async (userId, { phraseId, transcription, translation, translationAudioBase64, tags }) => {
    let translationS3Key: string | undefined;
    if (translation && translationAudioBase64) {
      translationS3Key = await audio.upload(translation, "en-US", translationAudioBase64, "translation");
    }
    return repo.update(userId, phraseId, { transcription, translation, translationS3Key, tags });
  };
}
