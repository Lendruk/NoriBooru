ALTER TABLE `media_items` ADD COLUMN original_file_name TEXT DEFAULT NULL;
--- StatementBreak
ALTER TABLE `media_items` ADD COLUMN source TEXT DEFAULT NULL;
--- StatementBreak
CREATE TABLE IF NOT EXISTS `active_watchers` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`paused` integer NOT NULL DEFAULT 0,
	`items_per_request` integer NOT NULL DEFAULT 0,
	`items_downloaded` integer NOT NULL DEFAULT 0,
	`total_items` integer,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`request_interval` integer NOT NULL DEFAULT 0,
	`last_requested_at` integer NOT NULL DEFAULT 0,
	`created_at` integer NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `active_watchers_to_tags` (
	`active_watcher_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`active_watcher_id`, `tag_id`),
	FOREIGN KEY (`active_watcher_id`) REFERENCES `active_watchers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);