import { randomUUID } from "node:crypto";

const [orderId] = process.argv.slice(2);
const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!orderId) throw new Error("Informe o ID do pedido técnico como primeiro argumento.");
if (process.env.MERCADO_PAGO_ALLOW_SANDBOX_PAYMENT_EXECUTION !== "true") {
  throw new Error("Execução bloqueada por segurança. Defina MERCADO_PAGO_ALLOW_SANDBOX_PAYMENT_EXECUTION=true apenas após aprovação explícita para uma nova cobrança sandbox.");
}
if (!publicKey?.startsWith("APP_USR-")) throw new Error("MERCADO_PAGO_PUBLIC_KEY de teste não configurada.");
if (!accessToken?.startsWith("APP_USR-")) throw new Error("MERCADO_PAGO_ACCESS_TOKEN de teste não configurado.");

const tokenResponse = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    card_number: "5480832801033311",
    expiration_month: 11,
    expiration_year: 2030,
    security_code: "123",
    cardholder: { name: "APRO", identification: { type: "CPF", number: "12345678909" } },
  }),
});

if (!tokenResponse.ok) throw new Error(`Falha ao tokenizar o cartão de teste: ${tokenResponse.status}`);
const { id: cardToken } = await tokenResponse.json();

const paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "X-Idempotency-Key": randomUUID(),
  },
  body: JSON.stringify({
    transaction_amount: 1,
    token: cardToken,
    description: "Validação técnica PlayStorCraft",
    installments: 1,
    payment_method_id: "master",
    external_reference: orderId,
    notification_url: "https://playstorcraft.com.br/api/webhooks/mercadopago",
    payer: { email: `sandbox-${Date.now()}@example.com` },
  }),
});

const payment = await paymentResponse.json();
if (!paymentResponse.ok) throw new Error(`Falha ao criar pagamento sandbox: ${paymentResponse.status} ${payment.message ?? ""}`);
console.log(JSON.stringify({ id: payment.id, status: payment.status, externalReference: payment.external_reference }, null, 2));
