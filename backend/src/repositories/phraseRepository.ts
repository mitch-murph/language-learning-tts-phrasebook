import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import type { Phrase } from "../domain";

export interface IPhraseRepository {
  save(input: Omit<Phrase, "phraseId" | "userId" | "createdAt">): Promise<Phrase>;
  list(): Promise<Phrase[]>;
  delete(phraseId: string): Promise<void>;
}

const USER_ID = "default";

export class DynamoDbPhraseRepository implements IPhraseRepository {
  private ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  constructor(private tableName: string) {}

  async save(input: Omit<Phrase, "phraseId" | "userId" | "createdAt">): Promise<Phrase> {
    const phrase: Phrase = {
      ...input,
      userId: USER_ID,
      phraseId: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await this.ddb.send(new PutCommand({ TableName: this.tableName, Item: phrase }));
    return phrase;
  }

  async list(): Promise<Phrase[]> {
    const result = await this.ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": USER_ID },
      })
    );
    const items = (result.Items ?? []) as Phrase[];
    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async delete(phraseId: string): Promise<void> {
    await this.ddb.send(
      new DeleteCommand({ TableName: this.tableName, Key: { userId: USER_ID, phraseId } })
    );
  }
}
