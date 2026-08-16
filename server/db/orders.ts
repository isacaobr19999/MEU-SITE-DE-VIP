import { and, count, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  categories,
  couponProducts,
  couponUsage,
  coupons,
  orderItems,
  orders,
  players,
  productServers,
  products,
} from "../../drizzle/schema";
import { calculateCouponDiscount } from "../domain/commerce";
import { requireDb } from "../db";

export type NewOrderInput = {
  username: string;
  uuid?: string;
  couponCode?: string;
  idempotencyKey: string;
  items: Array<{ productId: number; serverId: number }>;
};

function buildOrderNumber() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `PSC-${day}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/** Cria pedido com snapshots imutáveis, aplicação serializada de cupom e idempotência de checkout. */
export async function createOrderForUser(userId: number, input: NewOrderInput) {
  const db = await requireDb();

  return db.transaction(async tx => {
    const previous = await tx.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).limit(1);
    if (previous[0]) {
      if (previous[0].userId !== userId) throw new Error("Chave de checkout inválida");
      return { order: previous[0], reused: true };
    }

    const byUuid = input.uuid ? await tx.select().from(players).where(eq(players.uuid, input.uuid)).limit(1) : [];
    const byUsername = await tx.select().from(players).where(eq(players.username, input.username)).limit(1);
    let playerId: number;
    const player = byUuid[0] ?? byUsername[0];
    if (!player) throw new Error("Entre no servidor pelo menos uma vez antes de comprar para sincronizar seu jogador");
    if (player.userId !== null && player.userId !== userId) throw new Error("Este jogador já está vinculado a outra conta");
    if (input.uuid && player.uuid !== input.uuid) throw new Error("Este nome de jogador está vinculado a outro UUID");
    await tx.update(players).set({ userId, lastSeenAt: new Date() }).where(eq(players.id, player.id));
    playerId = player.id;

    const productIds = Array.from(new Set(input.items.map(item => item.productId)));
    const selected = await tx
      .select({
        id: products.id,
        name: products.name,
        priceCents: products.priceCents,
        durationDays: products.durationDays,
        luckPermsGroup: products.luckPermsGroup,
        deliveryCommands: products.deliveryCommands,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(inArray(products.id, productIds), eq(products.active, true), eq(categories.active, true)));

    if (selected.length !== productIds.length) throw new Error("Um ou mais produtos não estão disponíveis");
    const productById = new Map(selected.map(product => [product.id, product]));

    const destinationRows = await tx.select().from(productServers).where(inArray(productServers.productId, productIds));
    const allowedDestinations = new Set(destinationRows.map(row => `${row.productId}:${row.serverId}`));
    for (const item of input.items) {
      if (!allowedDestinations.has(`${item.productId}:${item.serverId}`)) {
        throw new Error("O produto selecionado não está disponível neste servidor");
      }
    }

    const subtotalCents = input.items.reduce((sum, item) => sum + (productById.get(item.productId)?.priceCents ?? 0), 0);
    let couponId: number | null = null;
    let discountCents = 0;

    if (input.couponCode) {
      const couponResult = await tx.select().from(coupons).where(eq(coupons.code, input.couponCode.toUpperCase())).limit(1);
      const coupon = couponResult[0];
      if (!coupon || !coupon.active) throw new Error("Cupom indisponível");

      // Mantém o lock de linha até o commit, impedindo ultrapassar o limite de usos em checkouts concorrentes.
      await tx.execute(sql`SELECT id FROM coupons WHERE id = ${coupon.id} FOR UPDATE`);

      const now = new Date();
      if ((coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt < now)) {
        throw new Error("Cupom fora do período de validade");
      }
      const [totalUsage] = await tx.select({ value: count() }).from(couponUsage).where(eq(couponUsage.couponId, coupon.id));
      const [playerUsage] = await tx
        .select({ value: count() })
        .from(couponUsage)
        .where(and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.playerId, playerId)));
      if ((coupon.maxUses !== null && totalUsage.value >= coupon.maxUses) || playerUsage.value >= coupon.maxUsesPerPlayer) {
        throw new Error("O limite de uso deste cupom foi atingido");
      }

      const scopedProducts = await tx.select({ productId: couponProducts.productId }).from(couponProducts).where(eq(couponProducts.couponId, coupon.id));
      if (scopedProducts.length > 0) {
        const allowedProducts = new Set(scopedProducts.map(item => item.productId));
        if (input.items.some(item => !allowedProducts.has(item.productId))) {
          throw new Error("O cupom não é válido para todos os produtos do carrinho");
        }
      }
      couponId = coupon.id;
      discountCents = calculateCouponDiscount(subtotalCents, coupon);
    }

    const orderId = randomUUID();
    const totalCents = subtotalCents - discountCents;
    const created = await tx.insert(orders).values({
      id: orderId,
      orderNumber: buildOrderNumber(),
      userId,
      playerId,
      couponId,
      status: "WAITING_PAYMENT",
      subtotalCents,
      discountCents,
      totalCents,
      idempotencyKey: input.idempotencyKey,
    });
    if (created[0].affectedRows !== 1) throw new Error("Não foi possível criar o pedido");

    await tx.insert(orderItems).values(
      input.items.map(item => {
        const product = productById.get(item.productId);
        if (!product) throw new Error("Produto não localizado");
        return {
          orderId,
          productId: item.productId,
          serverId: item.serverId,
          productName: product.name,
          unitPriceCents: product.priceCents,
          durationDays: product.durationDays,
          deliveryCommands: product.deliveryCommands,
          luckPermsGroup: product.luckPermsGroup,
        };
      })
    );

    if (couponId !== null && discountCents > 0) {
      await tx.insert(couponUsage).values({ couponId, playerId, orderId, discountCents });
    }
    const order = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return { order: order[0], reused: false };
  });
}

export async function listOrdersForUser(userId: number) {
  const db = await requireDb();
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(sql`${orders.createdAt} desc`);
}

export async function getOrderForUser(userId: number, orderId: string) {
  const db = await requireDb();
  const order = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
  if (!order[0]) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return { ...order[0], items };
}
