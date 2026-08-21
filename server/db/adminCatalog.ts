import { and, asc, eq } from "drizzle-orm";
import { categories, productServers, products } from "../../drizzle/schema";
import { requireDb } from "../db";

export type CreateCategoryRecord = {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  position: number;
};

export type CreateProductRecord = {
  categoryId: number;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  kind: "VIP" | "COINS" | "KIT" | "COSMETIC";
  imageUrl?: string;
  imageUrls?: string[];
  priceCents: number;
  durationDays?: number | null;
  luckPermsGroup?: string;
  deliveryCommands: string[];
  featured: boolean;
  position: number;
  serverIds: number[];
};

export async function listAdminCategories() {
  const db = await requireDb();
  return db.select().from(categories).orderBy(asc(categories.position), asc(categories.name));
}

export async function createCategoryRecord(input: CreateCategoryRecord) {
  const db = await requireDb();
  const result = await db.insert(categories).values({
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    position: input.position,
  });
  return result[0].insertId;
}

/** Cria produto e destinos no mesmo commit para impedir produtos sem rota de entrega. */
export async function createProductRecord(input: CreateProductRecord) {
  const db = await requireDb();
  return db.transaction(async tx => {
    const category = await tx.select({ id: categories.id }).from(categories).where(and(eq(categories.id, input.categoryId), eq(categories.active, true))).limit(1);
    if (!category[0]) throw new Error("Categoria indisponível");

    const productResult = await tx.insert(products).values({
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      kind: input.kind,
      imageUrl: input.imageUrl ?? null,
      imageUrls: input.imageUrls ?? [],
      priceCents: input.priceCents,
      durationDays: input.durationDays ?? null,
      luckPermsGroup: input.luckPermsGroup ?? null,
      deliveryCommands: input.deliveryCommands,
      featured: input.featured,
      position: input.position,
    });
    const productId = productResult[0].insertId;

    if (input.serverIds.length > 0) {
      await tx.insert(productServers).values(input.serverIds.map(serverId => ({ productId, serverId })));
    }
    return productId;
  });
}
