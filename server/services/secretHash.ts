import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

/** Hash resistente a brute force para chaves de servidores; o segredo bruto nunca é persistido. */
export async function hashSecret(secret: string, pepper: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = (await scrypt(`${secret}:${pepper}`, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${digest.toString("hex")}`;
}

export async function verifySecret(secret: string, storedHash: string, pepper: string) {
  const [algorithm, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = (await scrypt(`${secret}:${pepper}`, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
