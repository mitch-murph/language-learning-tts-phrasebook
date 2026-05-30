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
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        "Origin": "https://www.gstatic.com",
        "Referer": "https://www.gstatic.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0",
      },
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
