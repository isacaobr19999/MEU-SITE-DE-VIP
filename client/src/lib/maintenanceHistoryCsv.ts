export type MaintenanceHistoryCsvRow = {
  eventType: string;
  mode: string;
  message: string;
  reason: string | null;
  scheduledStartAt: Date | string | null;
  scheduledEndAt: Date | string | null;
  actorType: string;
  createdAt: Date | string;
};

function spreadsheetSafe(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function quote(value: string | null | undefined) {
  return `"${spreadsheetSafe(value ?? "").replaceAll('"', '""')}"`;
}

function displayDate(value: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
}

export function buildMaintenanceHistoryCsv(rows: MaintenanceHistoryCsvRow[]) {
  const header = ["Evento", "Modo", "Motivo", "Mensagem", "Início previsto", "Término previsto", "Responsável", "Registrado em"];
  const lines = rows.map(row => [row.eventType, row.mode, row.reason ?? "", row.message, displayDate(row.scheduledStartAt), displayDate(row.scheduledEndAt), row.actorType, displayDate(row.createdAt)].map(quote).join(";"));
  return `\ufeff${header.map(quote).join(";")}\n${lines.join("\n")}\n`;
}

export function downloadMaintenanceHistoryCsv(rows: MaintenanceHistoryCsvRow[]) {
  const blob = new Blob([buildMaintenanceHistoryCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `historico-manutencoes-playstorcraft-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
