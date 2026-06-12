import type { IPhraseRepository } from "../repositories/phraseRepository";

export type DeletePhraseFn = (userId: string, phraseId: string) => Promise<{ success: true }>;

export function makeDeletePhrase(repo: IPhraseRepository): DeletePhraseFn {
  return async (userId, phraseId) => {
    await repo.delete(userId, phraseId);
    return { success: true };
  };
}
