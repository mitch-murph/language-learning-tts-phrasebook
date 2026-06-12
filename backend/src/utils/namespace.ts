import { createHash } from "crypto";

export const DEFAULT_USER_ID = "default";

/**
 * Resolves the DynamoDB partition key (userId) from a client-supplied namespace.
 *
 * No namespace (the public app / eportfolio demo) maps to the shared "default"
 * partition. A namespace word maps to its own isolated partition, keyed by a
 * hash of the word — so the literal word is never the stored key, and a query
 * for one partition can never return another's rows. The word is normalised
 * (trim + lowercase) so the same word typed on any device resolves identically.
 */
export function resolveUserId(namespace: string | undefined): string {
  const word = (namespace ?? "").trim().toLowerCase();
  if (!word) return DEFAULT_USER_ID;
  return "ns_" + createHash("sha256").update(word).digest("hex");
}
