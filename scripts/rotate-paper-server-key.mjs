import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import mysql from "mysql2/promise";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const key = process.env.CURRENT_KEY;
const pepper = process.env.MINECRAFT_API_KEY_PEPPER;
const databaseUrl = process.env.DATABASE_URL;

if (!key || !pepper || !databaseUrl) {
  throw new Error("Ambiente incompleto para a rotação segura da chave do servidor.");
}

async function verifySecret(candidate, storedHash) {
  const [algorithm, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = (await scrypt(`${candidate}:${pepper}`, salt, 64));
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function hashSecret(secret) {
  const salt = randomBytes(16).toString("hex");
  const digest = (await scrypt(`${secret}:${pepper}`, salt, 64));
  return `scrypt$${salt}$${digest.toString("hex")}`;
}

const connection = await mysql.createConnection(databaseUrl);
try {
  const [servers] = await connection.query(
    "SELECT id, name, apiKeyHash FROM servers WHERE active = 1"
  );
  const matches = [];
  for (const server of servers) {
    if (await verifySecret(key, server.apiKeyHash)) matches.push(server);
  }
  if (matches.length !== 1) {
    throw new Error("A chave atual não corresponde a exatamente um servidor ativo.");
  }

  const server = matches[0];
  const newKey = `psc_${randomBytes(24).toString("base64url")}`;
  const newHash = await hashSecret(newKey);
  await connection.execute(
    "UPDATE servers SET apiKeyHash = ?, apiKeyLastFour = ? WHERE id = ?",
    [newHash, newKey.slice(-4), server.id]
  );
  await fs.writeFile("/tmp/playstorcraft-rotated-server-key", newKey, { mode: 0o600 });
  console.log(JSON.stringify({ rotatedServerId: server.id, rotatedServerName: server.name }));
} finally {
  await connection.end();
}
