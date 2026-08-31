CREATE TABLE `alarms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`equipment_id` integer NOT NULL,
	`severity` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`acknowledged_at` text,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `alarms_code_unique` ON `alarms` (`code`);--> statement-breakpoint
CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`location` text NOT NULL,
	`status` text DEFAULT 'Online' NOT NULL,
	`health_score` integer DEFAULT 100 NOT NULL,
	`zone_temp` real DEFAULT 72 NOT NULL,
	`supply_temp` real DEFAULT 55 NOT NULL,
	`static_pressure` real DEFAULT 1.25 NOT NULL,
	`runtime_hours` integer DEFAULT 0 NOT NULL,
	`energy_kw` real DEFAULT 0 NOT NULL,
	`last_service` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `equipment_name_unique` ON `equipment` (`name`);--> statement-breakpoint
CREATE TABLE `sensor_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_id` integer NOT NULL,
	`recorded_at` text NOT NULL,
	`zone_temp` real NOT NULL,
	`supply_temp` real NOT NULL,
	`demand` integer NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sensor_reading_equipment_time` ON `sensor_readings` (`equipment_id`,`recorded_at`);--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`equipment_id` integer NOT NULL,
	`title` text NOT NULL,
	`priority` text DEFAULT 'Medium' NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`assignee` text,
	`due_date` text,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_orders_code_unique` ON `work_orders` (`code`);