import type { IPhraseRepository } from "../repositories/phraseRepository";
import type { Phrase } from "../domain";

export interface UpdatePhraseInput {
  phraseId: string;
  transcription?: string;
  translation?: string;
}

export type UpdatePhraseFn = (input: UpdatePhraseInput) => Promise<Phrase>;

export function makeUpdatePhrase(repo: IPhraseRepository): UpdatePhraseFn {
  return async ({ phraseId, transcription, translation }) =>
    repo.update(phraseId, { transcription, translation });
}
