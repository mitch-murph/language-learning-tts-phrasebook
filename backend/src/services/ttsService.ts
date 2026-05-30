export interface ITtsService {
  synthesize(text: string, languageCode: string, ttsUrl: string): Promise<string>;
}

export class HttpTtsService implements ITtsService {
  async synthesize(
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

    if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);

    const { audioContent } = (await res.json()) as { audioContent: string };
    return audioContent;
  }
}
