import type { IPhraseRepository } from "../repositories/phraseRepository";

export type DeletePhraseFn = (phraseId: string) => Promise<{ success: true }>;

export function makeDeletePhrase(repo: IPhraseRepository): DeletePhraseFn {
  return async (phraseId) => {
    await repo.delete(phraseId);
    return { success: true };
  };
}
