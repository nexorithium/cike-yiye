CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`quote_id` text,
	`content` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notes_owner_updated_idx` ON `notes` (`owner_hash`,`updated_at`);