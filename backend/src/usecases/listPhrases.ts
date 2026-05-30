import type { IPhraseRepository } from "../repositories/phraseRepository";
import type { Phrase } from "../domain";

export type ListPhrasesFn = () => Promise<{ phrases: Phrase[] }>;

export function makeListPhrases(repo: IPhraseRepository): ListPhrasesFn {
  return async () => ({ phrases: await repo.list() });
}
