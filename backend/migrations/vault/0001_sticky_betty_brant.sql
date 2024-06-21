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
