import type { IPhraseRepository } from "../repositories/phraseRepository";
import type { Phrase } from "../domain";

export type ListPhrasesFn = (userId: string) => Promise<{ phrases: Phrase[] }>;

export function makeListPhrases(repo: IPhraseRepository): ListPhrasesFn {
  return async (userId) => ({ phrases: await repo.list(userId) });
}
