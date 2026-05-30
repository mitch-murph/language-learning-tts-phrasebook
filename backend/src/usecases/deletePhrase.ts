import type { IPhraseRepository } from "../repositories/phraseRepository";

export class DeletePhraseUseCase {
  constructor(private repo: IPhraseRepository) {}

  async execute(phraseId: string): Promise<{ success: true }> {
    await this.repo.delete(phraseId);
    return { success: true };
  }
}
