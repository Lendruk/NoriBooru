CREATE TABLE `vaults` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`path` text NOT NULL,
	`createdAt` integer DEFAULT 1722197779505 NOT NULL,
	`civitai_apikey` text
);
