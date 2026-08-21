import { count, gte, sql } from "drizzle-orm";
import { ticketTranscripts } from "../../drizzle/schema";
import { requireDb } from "../db";

export type TicketTranscriptMetadata = { messageId: string; closedAt: Date };

export async function recordTicketTranscripts(records: TicketTranscriptMetadata[]) {
  if (!records.length) return 0;
  const db = await requireDb();
  const unique = Array.from(new Map(records.map(record => [record.messageId, record])).values());
  await db.insert(ticketTranscripts).values(unique.map(record => ({ ...record, source: "TICKET_TOOL" }))).onDuplicateKeyUpdate({ set: { syncedAt: new Date() } });
  return unique.length;
}

export async function getMonthlyClosedTicketMetrics(monthCount = 6) {
  const db = await requireDb();
  const now = new Date();
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1), 1));
  const monthExpression = sql<string>`date_format(${ticketTranscripts.closedAt}, '%Y-%m')`;
  const rows = await db.select({ month: monthExpression, closedTickets: count() }).from(ticketTranscripts).where(gte(ticketTranscripts.closedAt, firstMonth)).groupBy(monthExpression).orderBy(monthExpression);
  const values = new Map(rows.map(row => [row.month, Number(row.closedTickets ?? 0)]));
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1 - index), 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return { key, label: formatter.format(date).replace(".", ""), closedTickets: values.get(key) ?? 0 };
  });
}
