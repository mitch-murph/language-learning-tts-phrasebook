import type { IPhraseRepository } from "../repositories/phraseRepository";
import type { Phrase } from "../domain";

export class ListPhrasesUseCase {
  constructor(private repo: IPhraseRepository) {}

  async execute(): Promise<{ phrases: Phrase[] }> {
    return { phrases: await this.repo.list() };
  }
}
