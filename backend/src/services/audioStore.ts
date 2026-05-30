import { createHash } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface IAudioStore {
  upload(text: string, languageCode: string, audioBase64: string): Promise<string>;
}

export class S3AudioStore implements IAudioStore {
  private s3 = new S3Client({});

  constructor(private bucket: string) {}

  async upload(text: string, languageCode: string, audioBase64: string): Promise<string> {
    const hash = createHash("sha256").update(text.normalize("NFC").trim()).digest("hex");
    const s3Key = `audio/${languageCode}/${hash}.mp3`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: Buffer.from(audioBase64, "base64"),
        ContentType: "audio/mpeg",
      })
    );

    return s3Key;
  }
}
