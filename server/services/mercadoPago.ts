import { MercadoPagoConfig, Payment, Preference, WebhookSignatureValidator } from "mercadopago";

function getCredentials() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const appBaseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (!accessToken || !appBaseUrl) throw new Error("Pagamentos ainda não foram configurados. Informe MERCADO_PAGO_ACCESS_TOKEN e APP_BASE_URL.");
  return { accessToken, appBaseUrl };
}

export function getMercadoPagoClient() {
  const { accessToken } = getCredentials();
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10_000, maxRetries: 2 } });
}

export async function createMercadoPagoPreference(input: { orderId: string; orderNumber: string; totalCents: number; items: Array<{ productId: number; productName: string; quantity: number; unitPriceCents: number }> }) {
  const { appBaseUrl } = getCredentials();
  const preference = new Preference(getMercadoPagoClient());
  const result = await preference.create({
    body: {
      external_reference: input.orderId,
      statement_descriptor: "PLAYSTORCRAFT",
      auto_return: "approved",
      back_urls: { success: `${appBaseUrl}/orders/${input.orderId}`, pending: `${appBaseUrl}/orders/${input.orderId}`, failure: `${appBaseUrl}/orders/${input.orderId}` },
      notification_url: `${appBaseUrl}/api/webhooks/mercadopago`,
      metadata: { order_id: input.orderId, order_number: input.orderNumber },
      items: input.items.map(item => ({ id: String(item.productId), title: item.productName, quantity: item.quantity, unit_price: item.unitPriceCents / 100, currency_id: "BRL" })),
    },
    requestOptions: { idempotencyKey: `psc-preference-${input.orderId}` },
  });
  const checkoutUrl = result.init_point ?? result.sandbox_init_point;
  if (!result.id || !checkoutUrl) throw new Error("O gateway não retornou uma URL de checkout.");
  return { preferenceId: result.id, checkoutUrl };
}

export async function getMercadoPagoPayment(id: string) {
  return new Payment(getMercadoPagoClient()).get({ id });
}

export function verifyMercadoPagoWebhook(input: { signature?: string; requestId?: string; dataId?: string }) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) throw new Error("A assinatura do webhook ainda não foi configurada.");
  if (!input.signature || !input.requestId || !input.dataId) throw new Error("Cabeçalhos ou identificador do webhook ausentes.");
  WebhookSignatureValidator.validate({ xSignature: input.signature, xRequestId: input.requestId, dataId: input.dataId, secret });
}
