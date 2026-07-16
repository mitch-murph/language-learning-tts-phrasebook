export interface Phrase {
  phraseId: string;
  userId: string;
  text: string;
  languageCode: string;
  languageName: string;
  nonLatin: boolean;
  normalS3Key: string;
  slowS3Key: string;
  createdAt: string;
  updatedAt?: string;
  transcription?: string;
  translation?: string;
  translationS3Key?: string;
  tags?: string[];
  hide?: boolean;
}
