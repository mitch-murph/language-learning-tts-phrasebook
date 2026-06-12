import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { verifyToken } from "./utils/auth";
import { resolveUserId } from "./utils/namespace";
import { makePhrasesRoute, ValidationError } from "./routes/phrases";
import { DynamoDbPhraseRepository } from "./repositories/phraseRepository";
import { S3AudioStore } from "./services/audioStore";
import { makeSavePhrase } from "./usecases/savePhrase";
import { makeListPhrases } from "./usecases/listPhrases";
import { makeDeletePhrase } from "./usecases/deletePhrase";
import { makeUpdatePhrase } from "./usecases/updatePhrase";

const HMAC_SECRET = process.env.HMAC_SECRET!;
const TABLE_NAME = process.env.TABLE_NAME!;
const AUDIO_BUCKET = process.env.AUDIO_BUCKET!;

const repo = new DynamoDbPhraseRepository(TABLE_NAME);
const audio = new S3AudioStore(AUDIO_BUCKET);

const phrases = makePhrasesRoute(
  makeSavePhrase(audio, repo),
  makeListPhrases(repo),
  makeDeletePhrase(repo),
  makeUpdatePhrase(audio, repo)
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,x-app-token,x-namespace",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

function ok(body: unknown): APIGatewayProxyResultV2 {
  return { statusCode: 200, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function fail(status: number, message: string): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: message }) };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const { method, path } = event.requestContext.http;
  const { requestId } = event.requestContext;
  const tag = `[${requestId}]`;

  if (method === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  console.log(`${tag} ${method} ${path}`);

  if (!verifyToken(event.headers["x-app-token"], HMAC_SECRET)) {
    console.warn(`${tag} auth failed`);
    return fail(401, "Invalid or expired token");
  }

  const userId = resolveUserId(event.headers["x-namespace"]);

  try {
    if (method === "GET" && path === "/phrases") {
      return ok(await phrases.handleGet(userId));
    }
    if (method === "POST" && path === "/phrases") {
      return ok(await phrases.handlePost(userId, event.body ?? "{}"));
    }
    const phraseMatch = path.match(/^\/phrases\/([^/]+)$/);
    if (method === "DELETE" && phraseMatch) {
      return ok(await phrases.handleDelete(userId, phraseMatch[1]));
    }
    if (method === "PUT" && phraseMatch) {
      return ok(await phrases.handlePut(userId, phraseMatch[1], event.body ?? "{}"));
    }
    return fail(404, "Not found");
  } catch (e) {
    if (e instanceof ValidationError) return fail(400, e.message);
    console.error(`${tag} unhandled error:`, e);
    return fail(500, "Internal server error");
  }
};
