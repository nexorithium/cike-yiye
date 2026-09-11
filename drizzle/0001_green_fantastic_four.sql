ALTER TABLE `readings` ADD `generation_status` text DEFAULT 'editorial' NOT NULL;--> statement-breakpoint
ALTER TABLE `readings` ADD `model_data` text;