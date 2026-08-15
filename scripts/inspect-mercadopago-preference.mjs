const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const preferenceId = process.env.MERCADO_PAGO_PREFERENCE_ID;

if (!accessToken || !preferenceId) {
  throw new Error("Defina MERCADO_PAGO_ACCESS_TOKEN e MERCADO_PAGO_PREFERENCE_ID.");
}

const response = await fetch(`https://api.mercadopago.com/checkout/preferences/${encodeURIComponent(preferenceId)}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const preference = await response.json();
if (!response.ok) throw new Error(`Falha ao consultar preferência: ${JSON.stringify(preference)}`);

console.log(JSON.stringify({
  id: preference.id,
  sandboxInitPoint: preference.sandbox_init_point,
  excludedPaymentMethods: preference.payment_methods?.excluded_payment_methods ?? [],
  excludedPaymentTypes: preference.payment_methods?.excluded_payment_types ?? [],
}, null, 2));
