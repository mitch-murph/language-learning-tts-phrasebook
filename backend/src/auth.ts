import { createHmac } from "crypto";

export function verifyToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const now = Math.floor(Date.now() / 30000);
  for (const w of [now, now - 1]) {
    const expected = createHmac("sha256", secret).update(String(w)).digest("hex");
    if (token === expected) return true;
  }
  return false;
}
