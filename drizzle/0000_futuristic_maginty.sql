CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`reading_id` text NOT NULL,
	`quote_id` text NOT NULL,
	`fit` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`reading_id`) REFERENCES `readings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feedback_reading_quote_idx` ON `feedback` (`reading_id`,`quote_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_expiry_idx` ON `rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `readings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`request_key` text NOT NULL,
	`topic` text NOT NULL,
	`preference` text NOT NULL,
	`quote_ids` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `readings_expiry_idx` ON `readings` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `readings_owner_request_idx` ON `readings` (`owner_hash`,`request_key`);--> statement-breakpoint
CREATE TABLE `reveals` (
	`id` text PRIMARY KEY NOT NULL,
	`reading_id` text NOT NULL,
	`quote_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`reading_id`) REFERENCES `readings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reveals_reading_quote_idx` ON `reveals` (`reading_id`,`quote_id`);