import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { verifyToken } from "./utils/auth";
import { PhrasesRoute, ValidationError } from "./routes/phrases";
import { DynamoDbPhraseRepository } from "./repositories/phraseRepository";
import { HttpTtsService } from "./services/ttsService";
import { S3AudioStore } from "./services/audioStore";
import { SynthesizePhraseUseCase } from "./usecases/synthesizePhrase";
import { SavePhraseUseCase } from "./usecases/savePhrase";
import { ListPhrasesUseCase } from "./usecases/listPhrases";
import { DeletePhraseUseCase } from "./usecases/deletePhrase";

const HMAC_SECRET = process.env.HMAC_SECRET!;
const TABLE_NAME = process.env.TABLE_NAME!;
const AUDIO_BUCKET = process.env.AUDIO_BUCKET!;

// Composition root — wired once at cold start
const repo = new DynamoDbPhraseRepository(TABLE_NAME);
const tts = new HttpTtsService();
const audio = new S3AudioStore(AUDIO_BUCKET);

const phrases = new PhrasesRoute(
  new SynthesizePhraseUseCase(tts),
  new SavePhraseUseCase(tts, audio, repo),
  new ListPhrasesUseCase(repo),
  new DeletePhraseUseCase(repo)
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,x-app-token,x-tts-url",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
};

function ok(body: unknown): APIGatewayProxyResultV2 {
  return { statusCode: 200, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function fail(status: number, message: string): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: message }) };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const { method, path } = event.requestContext.http;

  if (method === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  console.log("[handler] ${method} ${path}");

  if (!verifyToken(event.headers["x-app-token"], HMAC_SECRET)) {
    console.warn("[handler] auth failed");
    return fail(401, "Invalid or expired token");
  }

  try {
    if (method === "GET" && path === "/phrases") {
      return ok(await phrases.handleGet());
    }
    if (method === "POST" && path === "/phrases") {
      return ok(await phrases.handlePost(event.headers, event.body ?? "{}"));
    }
    const deleteMatch = path.match(/^\/phrases\/([^/]+)$/);
    if (method === "DELETE" && deleteMatch) {
      return ok(await phrases.handleDelete(deleteMatch[1]));
    }
    return fail(404, "Not found");
  } catch (e) {
    if (e instanceof ValidationError) return fail(400, e.message);
    console.error("[handler] unhandled error:", e);
    return fail(500, "Internal server error");
  }
};
