export type AdminOrderCsvRow = {
  orderNumber: string;
  status: string;
  totalCents: number;
  discountCents: number;
  createdAt: Date | string;
  paidAt: Date | string | null;
  playerName: string;
  playerUuid: string;
  couponCode: string | null;
};

function spreadsheetSafe(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function quote(value: string | number | null | undefined) {
  const normalized = spreadsheetSafe(String(value ?? ""));
  return `"${normalized.replaceAll('"', '""')}"`;
}

function displayDate(value: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
}

function decimalCents(value: number) {
  return (value / 100).toFixed(2).replace(".", ",");
}

export function buildAdminOrdersCsv(rows: AdminOrderCsvRow[]) {
  const header = ["Número do pedido", "Status", "Jogador", "UUID", "Cupom", "Desconto (R$)", "Total (R$)", "Criado em", "Pago em"];
  const lines = rows.map(row => [row.orderNumber, row.status, row.playerName, row.playerUuid, row.couponCode ?? "", decimalCents(row.discountCents), decimalCents(row.totalCents), displayDate(row.createdAt), displayDate(row.paidAt)].map(quote).join(";"));
  return `\ufeff${header.map(quote).join(";")}\n${lines.join("\n")}\n`;
}

export function downloadAdminOrdersCsv(rows: AdminOrderCsvRow[], filename = `pedidos-playstorcraft-${new Date().toISOString().slice(0, 10)}.csv`) {
  const blob = new Blob([buildAdminOrdersCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
