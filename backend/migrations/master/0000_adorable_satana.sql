CREATE TABLE `vaults` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`path` text NOT NULL,
	`createdAt` integer DEFAULT 1721067822749 NOT NULL,
	`has_installed_sd` integer DEFAULT 0 NOT NULL
);
