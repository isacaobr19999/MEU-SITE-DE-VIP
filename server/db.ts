import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { type InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let database: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) database = drizzle(process.env.DATABASE_URL);
  return database;
}

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("A identificação aberta do usuário é obrigatória");
  const db = await getDb();
  if (!db) return;
  const role = user.openId === ENV.ownerOpenId ? "admin" : user.role ?? "user";
  await db.insert(users).values({ openId: user.openId, name: user.name ?? null, email: user.email ?? null, passwordHash: user.passwordHash ?? null, loginMethod: user.loginMethod ?? null, role, lastSignedIn: user.lastSignedIn ?? new Date() }).onDuplicateKeyUpdate({ set: { name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, role, lastSignedIn: user.lastSignedIn ?? new Date() } });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
}

export async function hasAnyUser() {
  const db = await requireDb();
  return (await db.select({ id: users.id }).from(users).limit(1)).length > 0;
}

export async function createLocalUser(input: { name: string; email: string; passwordHash: string; role: "user" | "admin" }) {
  const db = await requireDb();
  const openId = `local_${crypto.randomUUID()}`;
  await db.insert(users).values({ openId, name: input.name, email: input.email, passwordHash: input.passwordHash, loginMethod: "local", role: input.role, lastSignedIn: new Date() });
  return getUserByOpenId(openId);
}
