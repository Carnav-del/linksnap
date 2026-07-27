const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; // base62

// Generates a random 7-character base62 code, e.g. "aZ3kLQ9".
// 62^7 is billions of possibilities, so collisions are extremely rare,
// but the caller should still check the database and retry on the
// (very unlikely) chance of a clash — see generateUniqueShortCode below.
export function randomShortCode(length = 7): string {
  let code = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
