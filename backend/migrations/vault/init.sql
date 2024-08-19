CREATE TABLE IF NOT EXISTS `loras_to_mediaItems` (
	`media_item_id` integer NOT NULL,
	`lora_id` text NOT NULL,
	PRIMARY KEY(`lora_id`, `media_item_id`),
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lora_id`) REFERENCES `sd_loras`(`id`) ON UPDATE no action ON DELETE cascade
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `media_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`type` text NOT NULL,
	`extension` text NOT NULL,
	`file_size` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`hash` text NOT NULL,
	`sd_checkpoint` text,
	FOREIGN KEY (`sd_checkpoint`) REFERENCES `sd_checkpoints`(`id`) ON UPDATE no action ON DELETE no action
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `media_items_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`media_item` integer,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`positive_prompt` text,
	`negative_prompt` text,
	`steps` integer,
	`seed` integer,
	`sampler` text,
	`model` text,
	`upscaler` text,
	`upscale_by` real,
	`cfg_scale` integer,
	`vae` text,
	`loras` text,
	`denoising_strength` real,
	FOREIGN KEY (`media_item`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `playlists` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`randomize_order` integer DEFAULT 0 NOT NULL,
	`time_per_item` integer DEFAULT 0,
	`updated_at` integer
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `playlists_media_items` (
	`playlist_id` integer NOT NULL,
	`media_item_id` integer NOT NULL,
	`item_index` integer NOT NULL,
	PRIMARY KEY(`media_item_id`, `playlist_id`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `sd_checkpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`description` text,
	`origin` text NOT NULL,
	`sd_version` text NOT NULL,
	`sha256` text NOT NULL,
	`preview_image` text
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `sd_loras` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`description` text,
	`metadata` text,
	`origin` text NOT NULL,
	`sd_version` text NOT NULL,
	`preview_image` text,
	`activation_words` text NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `sd_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`preview_image` text,
	`positive_prompt` text NOT NULL,
	`negative_prompt` text NOT NULL,
	`sampler` text NOT NULL,
	`steps` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`checkpoint` text NOT NULL,
	`cfg_scale` integer NOT NULL,
	`is_high_res_enabled` integer NOT NULL,
	`high_res_upscaler` text,
	`high_res_steps` integer,
	`high_res_denoising_strength` real,
	`high_res_upscale_by` real,
	`created_at` integer NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `sd_wildcards` (
	`id` text PRIMARY KEY NOT NULL,
	`list_name` text NOT NULL,
	`text` text NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`parent_id` integer
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `tags_to_loras` (
	`tag_id` integer NOT NULL,
	`lora_id` text NOT NULL,
	PRIMARY KEY(`lora_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lora_id`) REFERENCES `sd_loras`(`id`) ON UPDATE no action ON DELETE cascade
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `tags_to_media_items` (
	`tag_id` integer NOT NULL,
	`media_item_id` integer NOT NULL,
	PRIMARY KEY(`media_item_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
