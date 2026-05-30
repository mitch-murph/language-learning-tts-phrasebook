import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USER_ID = "default";

export interface Phrase {
  userId: string;
  phraseId: string;
  text: string;
  languageCode: string;
  s3Key: string;
  createdAt: string;
  transcription?: string;
  translation?: string;
}

export async function savePhrase(
  table: string,
  text: string,
  languageCode: string,
  s3Key: string,
  transcription?: string,
  translation?: string
): Promise<Phrase> {
  const phrase: Phrase = {
    userId: USER_ID,
    phraseId: randomUUID(),
    text,
    languageCode,
    s3Key,
    createdAt: new Date().toISOString(),
    transcription,
    translation,
  };
  await ddb.send(new PutCommand({ TableName: table, Item: phrase }));
  return phrase;
}

export async function listPhrases(table: string): Promise<Phrase[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": USER_ID },
    })
  );
  const items = (result.Items ?? []) as Phrase[];
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deletePhrase(table: string, phraseId: string): Promise<void> {
  await ddb.send(
    new DeleteCommand({ TableName: table, Key: { userId: USER_ID, phraseId } })
  );
}
