import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { type InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let database: ReturnType<typeof drizzle> | null = null;

/** Retorna a conexão tipada sem abrir conexões no contexto de ferramentas locais. */
export async function getDb() {
  if (!database && process.env.DATABASE_URL) {
    database = drizzle(process.env.DATABASE_URL);
  }
  return database;
}

export async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco de dados indisponível");
  }
  return db;
}

/** Mantém a identidade de login sincronizada e promove somente o proprietário configurado. */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("A identificação aberta do usuário é obrigatória");
  }

  const db = await getDb();
  if (!db) return;

  const role = user.openId === ENV.ownerOpenId ? "admin" : user.role ?? "user";
  await db
    .insert(users)
    .values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role,
      lastSignedIn: user.lastSignedIn ?? new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role,
        lastSignedIn: user.lastSignedIn ?? new Date(),
      },
    });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
