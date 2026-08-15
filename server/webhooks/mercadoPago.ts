import type { Request, Response } from "express";
import { applyMercadoPagoPayment } from "../db/payments";
import { getMercadoPagoPayment, verifyMercadoPagoWebhook } from "../services/mercadoPago";

type MercadoPagoNotification = { type?: string; action?: string; data?: { id?: string | number }; id?: string | number };

export async function mercadoPagoWebhook(req: Request, res: Response) {
  const notification = req.body as MercadoPagoNotification;
  const dataId = String(req.query["data.id"] ?? notification.data?.id ?? "");
  try {
    verifyMercadoPagoWebhook({ signature: req.header("x-signature") ?? undefined, requestId: req.header("x-request-id") ?? undefined, dataId });
  } catch {
    res.status(401).json({ error: "Assinatura de webhook inválida" });
    return;
  }
  if (notification.type !== "payment" || !dataId) {
    res.status(200).json({ ignored: true });
    return;
  }
  try {
    const payment = await getMercadoPagoPayment(dataId);
    await applyMercadoPagoPayment({ eventId: String(notification.id ?? `${notification.action ?? "payment"}:${dataId}`), payment });
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Mercado Pago Webhook] Processing failed", error);
    res.status(500).json({ error: "Falha temporária ao processar webhook" });
  }
}
