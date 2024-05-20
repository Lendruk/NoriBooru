CREATE TABLE `media_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`type` text NOT NULL,
	`extension` text NOT NULL,
	`file_size` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`exif` text
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
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`media_count` integer DEFAULT 0 NOT NULL,
	`parent_id` integer
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
