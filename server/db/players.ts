import { and, eq } from "drizzle-orm";
import { players } from "../../drizzle/schema";
import { requireDb } from "../db";

export async function syncMinecraftPlayer(username: string, uuid: string) {
  const db = await requireDb();
  return db.transaction(async tx => {
    const [byUuid] = await tx.select().from(players).where(eq(players.uuid, uuid)).limit(1);
    const [byUsername] = await tx.select().from(players).where(eq(players.username, username)).limit(1);
    if (byUuid && byUsername && byUuid.id !== byUsername.id) throw new Error("O nome do jogador já está vinculado a outro UUID");
    const existing = byUuid ?? byUsername;
    if (existing) {
      await tx.update(players).set({ username, uuid, lastSeenAt: new Date() }).where(eq(players.id, existing.id));
      return existing.id;
    }
    const result = await tx.insert(players).values({ username, uuid, lastSeenAt: new Date() });
    return result[0].insertId;
  });
}
