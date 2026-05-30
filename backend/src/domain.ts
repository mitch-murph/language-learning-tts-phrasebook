export interface Phrase {
  phraseId: string;
  userId: string;
  text: string;
  languageCode: string;
  s3Key: string;
  createdAt: string;
  transcription?: string;
  translation?: string;
}
