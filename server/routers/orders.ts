import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createOrderForUser, getOrderForUser, listOrdersForUser } from "../db/orders";
import { completeComplimentaryOrderForUser, getCheckoutOrderForUser, getSavedCheckout, saveCheckoutPreference } from "../db/payments";
import { protectedProcedure, router } from "../_core/trpc";
import { createMercadoPagoPreference } from "../services/mercadoPago";

const orderInput = z.object({
  username: z.string().trim().min(3).max(16).regex(/^[A-Za-z0-9_]+$/, "Use somente letras, números e sublinhado no nome Minecraft"),
  couponCode: z.string().trim().toUpperCase().max(48).optional(),
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({ productId: z.number().int().positive(), serverId: z.number().int().positive() })).min(1).max(12),
});

export const ordersRouter = router({
  create: protectedProcedure.input(orderInput).mutation(async ({ ctx, input }) => {
    try {
      return await createOrderForUser(ctx.user.id, input);
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível criar o pedido" });
    }
  }),
  checkout: protectedProcedure.input(z.object({ orderId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    try {
      const checkout = await getCheckoutOrderForUser(ctx.user.id, input.orderId);
      if (!checkout) throw new Error("Pedido não localizado");
      if (!["WAITING_PAYMENT", "PENDING"].includes(checkout.order.status)) throw new Error("Este pedido não pode mais ser pago");
      if (checkout.order.totalCents === 0) return completeComplimentaryOrderForUser(ctx.user.id, checkout.order.id);
      const existing = await getSavedCheckout(input.orderId);
      if (existing) return { ...existing, complimentary: false };
      const preference = await createMercadoPagoPreference({ orderId: checkout.order.id, orderNumber: checkout.order.orderNumber, totalCents: checkout.order.totalCents, items: checkout.items.map(item => ({ productId: item.productId, productName: item.productName, quantity: item.quantity, unitPriceCents: item.unitPriceCents })) });
      await saveCheckoutPreference({ orderId: checkout.order.id, amountCents: checkout.order.totalCents, ...preference });
      return { ...preference, complimentary: false };
    } catch (error) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Não foi possível iniciar o checkout" });
    }
  }),
  mine: protectedProcedure.query(({ ctx }) => listOrdersForUser(ctx.user.id)),
  byId: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const order = await getOrderForUser(ctx.user.id, input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não localizado" });
    return order;
  }),
});
