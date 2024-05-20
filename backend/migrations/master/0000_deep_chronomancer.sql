CREATE TABLE `vaults` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`path` text NOT NULL,
	`createdAt` integer DEFAULT 1716239615803 NOT NULL
);
