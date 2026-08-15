const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN não está configurado.");
}

const baseUrl = "https://playstorcraft.com.br";
const reference = `psc-checkout-validation-${Date.now()}`;
const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    external_reference: reference,
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    back_urls: {
      success: `${baseUrl}/orders`,
      pending: `${baseUrl}/orders`,
      failure: `${baseUrl}/orders`,
    },
    items: [{
      id: "checkout-validation",
      title: "Validação técnica PlayStorCraft",
      quantity: 1,
      unit_price: 1,
      currency_id: "BRL",
    }],
  }),
});

const payload = await response.json();
if (!response.ok || !payload.id) {
  throw new Error(`Não foi possível criar a preferência de teste: ${JSON.stringify(payload)}`);
}

console.log(JSON.stringify({
  preferenceId: payload.id,
  externalReference: reference,
  checkoutUrl: payload.sandbox_init_point ?? payload.init_point,
  webhookUrl: `${baseUrl}/api/webhooks/mercadopago`,
}, null, 2));
