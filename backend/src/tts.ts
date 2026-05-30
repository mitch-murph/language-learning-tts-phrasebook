import { createHash } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export async function synthesize(
  text: string,
  languageCode: string,
  ttsUrl: string,
  prompt = "Speak like a calm language tutor. Read the phrase slowly and clearly."
): Promise<string> {
  const res = await fetch(ttsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text, prompt },
      voice: { languageCode, name: "Charon", modelName: "gemini-3.1-flash-tts-preview" },
      audioConfig: { audioEncoding: "MP3", speakingRate: 1 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TTS ${res.status}: ${body}`);
  }

  const { audioContent } = (await res.json()) as { audioContent: string };
  return audioContent;
}

export async function uploadAudio(
  text: string,
  languageCode: string,
  audioBase64: string,
  bucket: string
): Promise<string> {
  const hash = createHash("sha256").update(text.normalize("NFC").trim()).digest("hex");
  const s3Key = `audio/${languageCode}/${hash}.mp3`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: Buffer.from(audioBase64, "base64"),
      ContentType: "audio/mpeg",
    })
  );

  return s3Key;
}
