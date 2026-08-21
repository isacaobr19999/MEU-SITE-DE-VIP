import { and, asc, count, desc, eq, like, or } from "drizzle-orm";
import { categories, couponProducts, couponUsage, coupons, productServers, products, servers } from "../../drizzle/schema";
import { requireDb } from "../db";
import { getPublicPromotionDiscountLabel, isPublicPromotionCurrent, promotionAppliesToActiveCatalog } from "../domain/publicPromotion";

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

/**
 * Expõe somente os dados necessários para apresentar campanhas reais na vitrine.
 * A validação definitiva do cupom continua ocorrendo no checkout, dentro da transação do pedido.
 */
export async function listPublicActivePromotions(now = new Date()) {
  const db = await requireDb();
  const [couponRows, assignments, usages, activeProducts] = await Promise.all([
    db
      .select({
        id: coupons.id,
        code: coupons.code,
        type: coupons.type,
        percentageBasisPoints: coupons.percentageBasisPoints,
        fixedDiscountCents: coupons.fixedDiscountCents,
        startsAt: coupons.startsAt,
        endsAt: coupons.endsAt,
        maxUses: coupons.maxUses,
        active: coupons.active,
      })
      .from(coupons)
      .where(eq(coupons.active, true)),
    db.select({ couponId: couponProducts.couponId, productId: couponProducts.productId }).from(couponProducts),
    db.select({ couponId: couponUsage.couponId, usedCount: count() }).from(couponUsage).groupBy(couponUsage.couponId),
    db
      .select({ id: products.id })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.active, true), eq(categories.active, true))),
  ]);

  const productIdsByCoupon = new Map<number, number[]>();
  for (const assignment of assignments) {
    productIdsByCoupon.set(assignment.couponId, [...(productIdsByCoupon.get(assignment.couponId) ?? []), assignment.productId]);
  }
  const usageByCoupon = new Map(usages.map(usage => [usage.couponId, Number(usage.usedCount)]));
  const activeProductIds = new Set(activeProducts.map(product => product.id));

  return couponRows
    .filter(coupon => isPublicPromotionCurrent(coupon, usageByCoupon.get(coupon.id) ?? 0, now))
    .filter(coupon => promotionAppliesToActiveCatalog(productIdsByCoupon.get(coupon.id) ?? [], activeProductIds))
    .sort((left, right) => (left.endsAt?.getTime() ?? Number.POSITIVE_INFINITY) - (right.endsAt?.getTime() ?? Number.POSITIVE_INFINITY))
    .map(coupon => ({
      code: coupon.code,
      discountLabel: getPublicPromotionDiscountLabel(coupon),
      endsAt: coupon.endsAt,
      appliesToAllProducts: !(productIdsByCoupon.get(coupon.id) ?? []).length,
    }));
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
