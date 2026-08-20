import { eq } from "drizzle-orm";
import { storeSettings } from "../../drizzle/schema";
import { requireDb } from "../db";

const DEFAULT_OFFLINE_MESSAGE = "A loja está temporariamente em manutenção. Volte em breve.";

export type StoreAvailability = {
  publicOnline: boolean;
  offlineMessage: string;
  updatedAt: Date | null;
};

export async function getStoreAvailability(): Promise<StoreAvailability> {
  const db = await requireDb();
  const [row] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  return row ?? { publicOnline: true, offlineMessage: DEFAULT_OFFLINE_MESSAGE, updatedAt: null };
}

export async function setStoreAvailability(input: { publicOnline: boolean; offlineMessage?: string }) {
  const db = await requireDb();
  const current = await getStoreAvailability();
  const values = {
    id: 1,
    publicOnline: input.publicOnline,
    offlineMessage: input.offlineMessage?.trim() || current.offlineMessage || DEFAULT_OFFLINE_MESSAGE,
  };
  await db.insert(storeSettings).values(values).onDuplicateKeyUpdate({ set: values });
  return getStoreAvailability();
}

export async function assertStoreOnline() {
  const settings = await getStoreAvailability();
  if (!settings.publicOnline) throw new Error(settings.offlineMessage || DEFAULT_OFFLINE_MESSAGE);
}
