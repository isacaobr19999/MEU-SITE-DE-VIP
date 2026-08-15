import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import mysql from "mysql2/promise";

const scrypt = promisify(scryptCallback);
const serverSlug = process.argv[2];
const pepper = process.env.MINECRAFT_API_KEY_PEPPER;
const databaseUrl = process.env.DATABASE_URL;

if (!serverSlug) throw new Error("Informe o slug do servidor Minecraft.");
if (!pepper) throw new Error("MINECRAFT_API_KEY_PEPPER não está configurado.");
if (!databaseUrl) throw new Error("DATABASE_URL não está configurada.");

const apiKey = `psc_${randomBytes(24).toString("base64url")}`;
const salt = randomBytes(16).toString("hex");
const digest = await scrypt(`${apiKey}:${pepper}`, salt, 64);
const apiKeyHash = `scrypt$${salt}$${Buffer.from(digest).toString("hex")}`;

const connection = await mysql.createConnection(databaseUrl);
try {
  const [result] = await connection.execute(
    "UPDATE servers SET apiKeyHash = ?, apiKeyLastFour = ? WHERE slug = ? AND active = 1",
    [apiKeyHash, apiKey.slice(-4), serverSlug],
  );
  if (result.affectedRows !== 1) throw new Error("Servidor ativo não encontrado para vinculação.");
  process.stdout.write(apiKey);
} finally {
  await connection.end();
}
