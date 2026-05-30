import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { verifyToken } from "./auth";
import { handlePost, handleGet, handleDelete, ValidationError } from "./routes/phrases";

const HMAC_SECRET = process.env.HMAC_SECRET!;
const TABLE_NAME = process.env.TABLE_NAME!;
const AUDIO_BUCKET = process.env.AUDIO_BUCKET!;

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

  if (!verifyToken(event.headers["x-app-token"], HMAC_SECRET)) {
    return fail(401, "Invalid or expired token");
  }

  try {
    if (method === "GET" && path === "/phrases") {
      return ok(await handleGet(TABLE_NAME));
    }

    if (method === "POST" && path === "/phrases") {
      return ok(await handlePost(event.headers, event.body ?? "{}", TABLE_NAME, AUDIO_BUCKET));
    }

    const deleteMatch = path.match(/^\/phrases\/([^/]+)$/);
    if (method === "DELETE" && deleteMatch) {
      return ok(await handleDelete(TABLE_NAME, deleteMatch[1]));
    }

    return fail(404, "Not found");
  } catch (e) {
    if (e instanceof ValidationError) return fail(400, e.message);
    console.error(e);
    return fail(500, "Internal server error");
  }
};
