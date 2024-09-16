CREATE TABLE IF NOT EXISTS `world` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_species` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_cultures` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`age` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`specie_id` text,
	`culture_id` text
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_currencies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`weight` integer NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_articles_to_tags` (
	`world_article_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`world_article_id`, `tag_id`),
	FOREIGN KEY (`world_article_id`) REFERENCES `world_articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_items_to_world_currencies` (
	`world_item_id` text NOT NULL,
	`world_currency_id` text NOT NULL,
	`value` integer NOT NULL,
	PRIMARY KEY(`world_item_id`, `world_currency_id`),
	FOREIGN KEY (`world_item_id`) REFERENCES `world_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`world_currency_id`) REFERENCES `world_currencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_items_to_media_items` (
	`world_item_id` text NOT NULL,
	`media_item_id` text NOT NULL,
	PRIMARY KEY(`world_item_id`, `media_item_id`),
	FOREIGN KEY (`world_item_id`) REFERENCES `world_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--- StatementBreak
CREATE TABLE IF NOT EXISTS `world_characters_to_media_items` (
	`world_character_id` text NOT NULL,
	`media_item_id` text NOT NULL,
	PRIMARY KEY(`world_character_id`, `media_item_id`),
	FOREIGN KEY (`world_character_id`) REFERENCES `world_characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade
);