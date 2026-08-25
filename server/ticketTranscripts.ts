import type { Request, Response } from "express";
import { z } from "zod";
import { isDiscordBridgeAuthorized } from "./community";
import { recordTicketTranscripts } from "./db/ticketTranscripts";

const ticketTranscriptInput = z.object({
  transcripts: z.array(z.object({ messageId: z.string().trim().regex(/^\d{16,22}$/), closedAt: z.coerce.date() })).max(25).default([]),
});

export async function recordTicketTranscriptsRoute(req: Request, res: Response) {
  try {
    if (!isDiscordBridgeAuthorized(req.header("x-playstor-discord-secret"))) return res.status(401).json({ error: "Ponte Discord não autorizada" });
    const input = ticketTranscriptInput.parse(req.body);
    return res.json({ recorded: await recordTicketTranscripts(input.transcripts) });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Metadados de transcrição inválidos." });
  }
}
