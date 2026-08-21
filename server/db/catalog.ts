import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { categories, productServers, products, servers } from "../../drizzle/schema";
import { requireDb } from "../db";

export type ProductSearchInput = {
  categorySlug?: string;
  query?: string;
  featuredOnly?: boolean;
};

/** Lista a taxonomia ativa sem expor configurações administrativas. */
export async function listPublicCategories() {
  const db = await requireDb();
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      imageUrl: categories.imageUrl,
    })
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(asc(categories.position), asc(categories.name));
}

/** Pesquisa apenas produtos ativos, usando parâmetros preparados pelo ORM. */
export async function listPublicProducts(input: ProductSearchInput = {}) {
  const db = await requireDb();
  const search = input.query?.trim();
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      kind: products.kind,
      imageUrl: products.imageUrl,
      imageUrls: products.imageUrls,
      priceCents: products.priceCents,
      durationDays: products.durationDays,
      featured: products.featured,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.active, true),
        eq(categories.active, true),
        input.categorySlug ? eq(categories.slug, input.categorySlug) : undefined,
        input.featuredOnly ? eq(products.featured, true) : undefined,
        search
          ? or(like(products.name, `%${search}%`), like(products.shortDescription, `%${search}%`), like(categories.name, `%${search}%`))
          : undefined
      )
    )
    .orderBy(desc(products.featured), asc(products.position), asc(products.name));

  return rows;
}

export async function getPublicProductBySlug(slug: string) {
  const db = await requireDb();
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      kind: products.kind,
      imageUrl: products.imageUrl,
      imageUrls: products.imageUrls,
      priceCents: products.priceCents,
      durationDays: products.durationDays,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.active, true), eq(categories.active, true)))
    .limit(1);
  return rows[0];
}

/** Retorna somente servidores ativos aos quais o produto pode ser destinado. */
export async function listProductServers(productId: number) {
  const db = await requireDb();
  return db
    .select({
      id: servers.id,
      name: servers.name,
      slug: servers.slug,
      kind: servers.kind,
    })
    .from(productServers)
    .innerJoin(servers, eq(productServers.serverId, servers.id))
    .where(and(eq(productServers.productId, productId), eq(servers.active, true)))
    .orderBy(asc(servers.name));
}
