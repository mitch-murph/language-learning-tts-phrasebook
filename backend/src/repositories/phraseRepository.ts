import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import type { Phrase } from "../domain";

export interface IPhraseRepository {
  save(userId: string, input: Omit<Phrase, "phraseId" | "userId" | "createdAt" | "updatedAt">): Promise<Phrase>;
  list(userId: string): Promise<Phrase[]>;
  delete(userId: string, phraseId: string): Promise<void>;
  update(userId: string, phraseId: string, fields: { transcription?: string; translation?: string; translationS3Key?: string; tags?: string[] }): Promise<Phrase>;
}

export class DynamoDbPhraseRepository implements IPhraseRepository {
  private ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  constructor(private tableName: string) {}

  async save(userId: string, input: Omit<Phrase, "phraseId" | "userId" | "createdAt" | "updatedAt">): Promise<Phrase> {
    const phrase: Phrase = {
      ...input,
      userId,
      phraseId: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await this.ddb.send(new PutCommand({ TableName: this.tableName, Item: phrase }));
    return phrase;
  }

  async list(userId: string): Promise<Phrase[]> {
    const result = await this.ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );
    const items = (result.Items ?? []) as Phrase[];
    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async delete(userId: string, phraseId: string): Promise<void> {
    await this.ddb.send(
      new DeleteCommand({ TableName: this.tableName, Key: { userId, phraseId } })
    );
  }

  async update(userId: string, phraseId: string, fields: { transcription?: string; translation?: string; translationS3Key?: string; tags?: string[] }): Promise<Phrase> {
    const updatedAt = new Date().toISOString();
    const setParts = ["#ua = :ua"];
    const exprNames: Record<string, string> = { "#ua": "updatedAt" };
    const exprValues: Record<string, unknown> = { ":ua": updatedAt };
    if (fields.transcription !== undefined) { setParts.push("#tc = :tc"); exprNames["#tc"] = "transcription"; exprValues[":tc"] = fields.transcription; }
    if (fields.translation !== undefined) { setParts.push("#tr = :tr"); exprNames["#tr"] = "translation"; exprValues[":tr"] = fields.translation; }
    if (fields.translationS3Key !== undefined) { setParts.push("#ts = :ts"); exprNames["#ts"] = "translationS3Key"; exprValues[":ts"] = fields.translationS3Key; }
    if (fields.tags !== undefined) { setParts.push("#tg = :tg"); exprNames["#tg"] = "tags"; exprValues[":tg"] = fields.tags; }
    const result = await this.ddb.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { userId, phraseId },
        UpdateExpression: `SET ${setParts.join(", ")}`,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes as Phrase;
  }
}
