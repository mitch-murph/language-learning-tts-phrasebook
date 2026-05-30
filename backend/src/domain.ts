export interface Phrase {
  phraseId: string;
  userId: string;
  text: string;
  languageCode: string;
  languageName: string;
  nonLatin: boolean;
  s3Key: string;
  createdAt: string;
  updatedAt?: string;
  transcription?: string;
  translation?: string;
}
