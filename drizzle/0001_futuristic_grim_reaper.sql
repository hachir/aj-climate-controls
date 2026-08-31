CREATE TABLE `service_appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_id` integer NOT NULL,
	`title` text NOT NULL,
	`service_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`technician` text DEFAULT 'AJ' NOT NULL,
	`status` text DEFAULT 'Scheduled' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `service_appointments_date_idx` ON `service_appointments` (`service_date`);