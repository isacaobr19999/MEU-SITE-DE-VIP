CREATE TABLE `ticket_transcripts` (
	`messageId` varchar(32) NOT NULL,
	`source` varchar(32) NOT NULL DEFAULT 'TICKET_TOOL',
	`closedAt` timestamp NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_transcripts_messageId` PRIMARY KEY(`messageId`)
);
--> statement-breakpoint
CREATE INDEX `ticket_transcripts_closed_idx` ON `ticket_transcripts` (`closedAt`);