CREATE TABLE `loras_to_mediaItems` (
	`media_item_id` integer NOT NULL,
	`lora_id` text NOT NULL,
	PRIMARY KEY(`lora_id`, `media_item_id`),
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lora_id`) REFERENCES `sd_loras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`type` text NOT NULL,
	`extension` text NOT NULL,
	`file_size` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`hash` text NOT NULL,
	`exif` text,
	`sd_checkpoint` text,
	FOREIGN KEY (`sd_checkpoint`) REFERENCES `sd_checkpoints`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`randomize_order` integer DEFAULT 0 NOT NULL,
	`time_per_item` integer DEFAULT 0,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `playlists_media_items` (
	`playlist_id` integer NOT NULL,
	`media_item_id` integer NOT NULL,
	`item_index` integer NOT NULL,
	PRIMARY KEY(`media_item_id`, `playlist_id`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sd_checkpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`description` text,
	`origin` text NOT NULL,
	`sd_version` text NOT NULL,
	`sha256` text NOT NULL,
	`preview_image` text
);
--> statement-breakpoint
CREATE TABLE `sd_loras` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`description` text,
	`metadata` text,
	`preview_image` text,
	`origin` text NOT NULL,
	`sd_version` text NOT NULL,
	`activation_words` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sd_prompts` (
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
	`high_res_denoising_strength` integer,
	`high_res_upscale_by` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sd_wildcards` (
	`id` text PRIMARY KEY NOT NULL,
	`list_name` text NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`parent_id` integer
);
--> statement-breakpoint
CREATE TABLE `tags_to_loras` (
	`tag_id` integer NOT NULL,
	`lora_id` text NOT NULL,
	PRIMARY KEY(`lora_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lora_id`) REFERENCES `sd_loras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags_to_media_items` (
	`tag_id` integer NOT NULL,
	`media_item_id` integer NOT NULL,
	PRIMARY KEY(`media_item_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
