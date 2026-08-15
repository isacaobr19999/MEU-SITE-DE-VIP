const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const externalReference = process.env.MERCADO_PAGO_TEST_REFERENCE;

if (!accessToken) {
  throw new Error("Defina MERCADO_PAGO_ACCESS_TOKEN.");
}

const query = externalReference
  ? `external_reference=${encodeURIComponent(externalReference)}`
  : "sort=date_created&criteria=desc&limit=10";
const response = await fetch(`https://api.mercadopago.com/v1/payments/search?${query}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const payload = await response.json();

if (!response.ok) {
  throw new Error(`Falha ao consultar o pagamento de teste: ${JSON.stringify(payload)}`);
}

const payments = Array.isArray(payload.results) ? payload.results : [];
console.log(JSON.stringify(payments.map(payment => ({
  id: payment.id,
  status: payment.status,
  statusDetail: payment.status_detail,
  externalReference: payment.external_reference,
  amount: payment.transaction_amount,
})), null, 2));
