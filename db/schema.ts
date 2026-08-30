import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const equipment = sqliteTable("equipment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default("Online"),
  healthScore: integer("health_score").notNull().default(100),
  zoneTemp: real("zone_temp").notNull().default(72),
  supplyTemp: real("supply_temp").notNull().default(55),
  staticPressure: real("static_pressure").notNull().default(1.25),
  runtimeHours: integer("runtime_hours").notNull().default(0),
  energyKw: real("energy_kw").notNull().default(0),
  lastService: text("last_service"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workOrders = sqliteTable("work_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipment.id),
  title: text("title").notNull(),
  priority: text("priority").notNull().default("Medium"),
  status: text("status").notNull().default("Open"),
  assignee: text("assignee"),
  dueDate: text("due_date"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const alarms = sqliteTable("alarms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipment.id),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("Active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  acknowledgedAt: text("acknowledged_at"),
});

export const sensorReadings = sqliteTable(
  "sensor_readings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    equipmentId: integer("equipment_id")
      .notNull()
      .references(() => equipment.id),
    recordedAt: text("recorded_at").notNull(),
    zoneTemp: real("zone_temp").notNull(),
    supplyTemp: real("supply_temp").notNull(),
    demand: integer("demand").notNull(),
  },
  (table) => [
    uniqueIndex("sensor_reading_equipment_time").on(
      table.equipmentId,
      table.recordedAt,
    ),
  ],
);

export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
