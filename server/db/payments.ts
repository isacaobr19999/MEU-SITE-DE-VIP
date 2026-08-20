import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { deliveries, logs, orderItems, orders, payments } from "../../drizzle/schema";
import { requireDb } from "../db";
import { enqueueDiscordNotification } from "./discordNotifications";

export async function getCheckoutOrderForUser(userId: number, orderId: string) {
  const db = await requireDb();
  const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
  if (!order) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return { order, items };
}

export async function getSavedCheckout(orderId: string) {
  const db = await requireDb();
  const [payment] = await db.select().from(payments).where(and(eq(payments.orderId, orderId), eq(payments.provider, "mercado_pago"), eq(payments.status, "PENDING"))).limit(1);
  const payload = payment?.gatewayPayload;
  return typeof payload?.checkoutUrl === "string" && typeof payload.preferenceId === "string" ? { checkoutUrl: payload.checkoutUrl, preferenceId: payload.preferenceId } : undefined;
}

export async function saveCheckoutPreference(input: { orderId: string; amountCents: number; preferenceId: string; checkoutUrl: string }) {
  const db = await requireDb();
  const idempotencyKey = `mp-checkout:${input.orderId}`;
  await db.insert(payments).values({ id: randomUUID(), orderId: input.orderId, provider: "mercado_pago", method: "OTHER", status: "PENDING", amountCents: input.amountCents, idempotencyKey, gatewayPayload: { preferenceId: input.preferenceId, checkoutUrl: input.checkoutUrl } }).onDuplicateKeyUpdate({ set: { gatewayPayload: { preferenceId: input.preferenceId, checkoutUrl: input.checkoutUrl } } });
}

/** Finaliza pedidos totalmente cobertos por cupom sem enviar um preço zero ao gateway. */
export async function completeComplimentaryOrderForUser(userId: number, orderId: string) {
  const db = await requireDb();
  return db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
    if (!order) throw new Error("Pedido não localizado");
    if (order.totalCents !== 0) throw new Error("Este pedido ainda possui valor a pagar");
    if (!["WAITING_PAYMENT", "PENDING", "PAID", "PROCESSING", "COMPLETED"].includes(order.status)) throw new Error("Este pedido não pode mais ser processado");

    const now = new Date();
    await tx.update(payments).set({ status: "CANCELLED" }).where(and(eq(payments.orderId, order.id), eq(payments.provider, "mercado_pago"), eq(payments.status, "PENDING")));
    await tx.insert(payments).values({ id: randomUUID(), orderId: order.id, provider: "coupon", method: "OTHER", status: "APPROVED", amountCents: 0, idempotencyKey: `coupon-complete:${order.id}`, gatewayPayload: { reason: "coupon_covered_total" }, paidAt: now }).onDuplicateKeyUpdate({ set: { status: "APPROVED", paidAt: now, gatewayPayload: { reason: "coupon_covered_total" } } });

    if (!["PAID", "PROCESSING", "COMPLETED"].includes(order.status)) {
      await tx.update(orders).set({ status: "PAID", paidAt: now }).where(eq(orders.id, order.id));
    }
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const item of items) {
      const commandTemplates = item.luckPermsGroup ? [...item.deliveryCommands, `@luckperms:add:${item.luckPermsGroup}`] : item.deliveryCommands;
      await tx.insert(deliveries).values({ id: randomUUID(), orderId: order.id, orderItemId: item.id, playerId: order.playerId, serverId: item.serverId, status: "PENDING", commandTemplates, idempotencyKey: `delivery:${order.id}:${item.id}` }).onDuplicateKeyUpdate({ set: { status: "PENDING", nextAttemptAt: now } });
    }
    return { preferenceId: `coupon-${order.id}`, checkoutUrl: `/orders/${order.id}`, complimentary: true };
  });
}

type GatewayPayment = { id?: number; status?: string; status_detail?: string; payment_type_id?: string; transaction_amount?: number; external_reference?: string; date_approved?: string; date_created?: string };

export function mapMercadoPagoStatus(status?: string) {
  if (status === "approved") return { paymentStatus: "APPROVED" as const, orderStatus: "PAID" as const };
  if (status === "refunded" || status === "charged_back") return { paymentStatus: "REFUNDED" as const, orderStatus: "REFUNDED" as const };
  if (status === "rejected") return { paymentStatus: "REJECTED" as const, orderStatus: "FAILED" as const };
  if (status === "cancelled") return { paymentStatus: "CANCELLED" as const, orderStatus: "CANCELLED" as const };
  if (status === "in_process") return { paymentStatus: "PROCESSING" as const, orderStatus: "WAITING_PAYMENT" as const };
  return { paymentStatus: "PENDING" as const, orderStatus: "WAITING_PAYMENT" as const };
}

export function mapMercadoPagoMethod(type?: string) {
  if (type === "pix") return "PIX" as const;
  if (type === "credit_card" || type === "debit_card") return "CARD" as const;
  return "OTHER" as const;
}

export async function applyMercadoPagoPayment(input: { eventId: string; payment: GatewayPayment }) {
  const externalReference = input.payment.external_reference;
  const providerPaymentId = input.payment.id ? String(input.payment.id) : undefined;
  if (!externalReference || !providerPaymentId) throw new Error("O pagamento notificado não possui referência externa válida.");
  const db = await requireDb();
  const result = await db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, externalReference)).limit(1);
    if (!order) throw new Error("O pagamento recebido não pertence a um pedido conhecido.");
    const amountCents = Math.round(Number(input.payment.transaction_amount ?? 0) * 100);
    if (amountCents !== order.totalCents) throw new Error("O valor confirmado pelo gateway diverge do pedido.");
    const mapped = mapMercadoPagoStatus(input.payment.status);
    const [storedPayment] = await tx.select().from(payments).where(and(eq(payments.orderId, order.id), eq(payments.provider, "mercado_pago"))).limit(1);
    const payload = { providerStatus: input.payment.status ?? "unknown", statusDetail: input.payment.status_detail ?? null, eventId: input.eventId };
    if (storedPayment) {
      await tx.update(payments).set({ providerPaymentId, providerEventId: input.eventId, method: mapMercadoPagoMethod(input.payment.payment_type_id), status: mapped.paymentStatus, gatewayPayload: payload, paidAt: mapped.paymentStatus === "APPROVED" ? new Date(input.payment.date_approved ?? Date.now()) : null, refundedAt: mapped.paymentStatus === "REFUNDED" ? new Date() : null }).where(eq(payments.id, storedPayment.id));
    } else {
      await tx.insert(payments).values({ id: randomUUID(), orderId: order.id, provider: "mercado_pago", providerPaymentId, providerEventId: input.eventId, method: mapMercadoPagoMethod(input.payment.payment_type_id), status: mapped.paymentStatus, amountCents, idempotencyKey: `mp-payment:${providerPaymentId}`, gatewayPayload: payload, paidAt: mapped.paymentStatus === "APPROVED" ? new Date(input.payment.date_approved ?? Date.now()) : null });
    }
    const becamePaid = mapped.orderStatus === "PAID" && !["PAID", "PROCESSING", "COMPLETED"].includes(order.status);
    if (becamePaid) {
      await tx.update(orders).set({ status: "PAID", paidAt: new Date(input.payment.date_approved ?? Date.now()) }).where(eq(orders.id, order.id));
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      for (const item of items) {
        const commandTemplates = item.luckPermsGroup ? [...item.deliveryCommands, `@luckperms:add:${item.luckPermsGroup}`] : item.deliveryCommands;
        await tx.insert(deliveries).values({ id: randomUUID(), orderId: order.id, orderItemId: item.id, playerId: order.playerId, serverId: item.serverId, status: "PENDING", commandTemplates, idempotencyKey: `delivery:${order.id}:${item.id}` }).onDuplicateKeyUpdate({ set: { status: "PENDING", nextAttemptAt: new Date() } });
      }
    } else if (mapped.orderStatus !== "WAITING_PAYMENT" && !["COMPLETED", "PROCESSING", "PAID"].includes(order.status)) {
      await tx.update(orders).set({ status: mapped.orderStatus, cancelledAt: mapped.orderStatus === "CANCELLED" ? new Date() : null }).where(eq(orders.id, order.id));
    }
    await tx.insert(logs).values({ actorType: "gateway", actorId: "mercado_pago", action: "payment.synchronized", entityType: "order", entityId: order.id, metadata: payload });
    return { orderId: order.id, status: mapped.orderStatus, becamePaid, orderNumber: order.orderNumber, totalCents: order.totalCents };
  });
  if (result.becamePaid) {
    await enqueueDiscordNotification({ eventType: "PAYMENT_APPROVED", orderId: result.orderId, dedupeKey: `payment-approved:${result.orderId}`, payload: { orderNumber: result.orderNumber, totalCents: result.totalCents } });
  }
  return { orderId: result.orderId, status: result.status };
}
