import { getD1 } from "../../../db";

const equipmentSeed = [
  ["RTU-4", "Rooftop Unit", "Production East", "Service", 72, 76.8, 61.4, 0.92, 8120, 18.6, "2026-08-27"],
  ["RTU-5", "Rooftop Unit", "Production West", "Service", 58, 79.4, 64.8, 0.74, 9364, 16.2, "2026-08-27"],
  ["RTU-6", "Rooftop Unit", "Packaging", "Online", 91, 72.6, 55.8, 1.31, 7681, 14.9, "2026-08-27"],
  ["RTU-8", "Rooftop Unit", "Warehouse", "Online", 97, 71.9, 54.7, 1.42, 6532, 12.4, "2026-08-26"],
  ["RTU-12", "Rooftop Unit", "Main Production", "Online", 94, 72.1, 55.2, 1.48, 10421, 22.8, "2026-08-26"],
  ["CHP-2", "Hydronic Pump", "Mechanical Room", "Online", 96, 69.8, 58.1, 1.76, 11892, 8.7, "2026-08-24"],
] as const;

const workOrderSeed = [
  ["WO-1048", "RTU-5", "Replace blower motor VFD", "High", "In Progress", "AJ", "2026-09-01", "Verify programming and rotation after replacement."],
  ["WO-1049", "RTU-6", "Replace 24 VDC control relay", "Medium", "Open", "AJ", "2026-09-03", "Use JQX-28F/2Z DPDT relay."],
  ["WO-1050", "RTU-12", "Inspect filter pressure drop", "Medium", "Open", "AJ", "2026-09-05", "Confirm airflow and update filter schedule."],
] as const;

const alarmSeed = [
  ["AL-203", "RTU-4", "Critical", "Analog output exceeds the 0–10 VDC range"],
  ["AL-204", "RTU-5", "High", "Blower VFD fault detected"],
  ["AL-205", "RTU-12", "Warning", "Filter differential pressure is elevated"],
] as const;

const readingSeed = [
  ["06:00", 71.2, 55.1, 28], ["07:00", 71.4, 55.0, 34],
  ["08:00", 71.7, 54.9, 42], ["09:00", 71.9, 55.2, 39],
  ["10:00", 72.0, 55.3, 55], ["11:00", 72.2, 55.1, 48],
  ["12:00", 72.5, 55.4, 67], ["13:00", 72.6, 55.6, 62],
  ["14:00", 72.4, 55.4, 76], ["15:00", 72.3, 55.3, 70],
  ["16:00", 72.2, 55.2, 64], ["17:00", 72.1, 55.2, 64],
] as const;

const appointmentSeed = [
  ["Quarterly controls inspection", "RTU-12", "2026-09-02", "08:00", "10:00", "AJ", "Scheduled", "Verify sensors, safeties, and VFD operation."],
  ["Blower VFD commissioning", "RTU-5", "2026-09-04", "13:00", "15:30", "AJ", "Scheduled", "Confirm rotation, parameters, and BAS feedback."],
  ["Filter pressure review", "RTU-12", "2026-09-08", "09:30", "10:30", "Ryan", "Scheduled", "Record pressure drop and airflow readings."],
] as const;

function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected database error";

  if (message.includes("no such table")) {
    return "The dashboard database is not ready. Publish the generated D1 migration before using the dashboard.";
  }

  return message;
}

async function seedDemoData() {
  const db = getD1();
  const seeded = await db
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .bind("demo_seed_v1")
    .first<{ value: string }>();

  if (seeded) return;

  const statements = equipmentSeed.map((row) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO equipment
          (name, type, location, status, health_score, zone_temp, supply_temp, static_pressure, runtime_hours, energy_kw, last_service)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(...row),
  );

  await db.batch(statements);

  await db.batch([
    ...workOrderSeed.map((row) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO work_orders
            (code, equipment_id, title, priority, status, assignee, due_date, notes)
           VALUES (?, (SELECT id FROM equipment WHERE name = ?), ?, ?, ?, ?, ?, ?)`,
        )
        .bind(...row),
    ),
    ...alarmSeed.map((row) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO alarms
            (code, equipment_id, severity, message)
           VALUES (?, (SELECT id FROM equipment WHERE name = ?), ?, ?)`,
        )
        .bind(...row),
    ),
    ...readingSeed.map((row) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO sensor_readings
            (equipment_id, recorded_at, zone_temp, supply_temp, demand)
           VALUES ((SELECT id FROM equipment WHERE name = 'RTU-12'), ?, ?, ?, ?)`,
        )
        .bind(...row),
    ),
    db
      .prepare("INSERT OR IGNORE INTO app_meta (key, value) VALUES (?, ?)")
      .bind("demo_seed_v1", new Date().toISOString()),
  ]);
}

async function seedAppointmentData() {
  const db = getD1();
  const seeded = await db
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .bind("demo_appointments_v1")
    .first<{ value: string }>();

  if (seeded) return;

  await db.batch([
    ...appointmentSeed.map((row) =>
      db
        .prepare(
          `INSERT INTO service_appointments
            (title, equipment_id, service_date, start_time, end_time, technician, status, notes)
           VALUES (?, (SELECT id FROM equipment WHERE name = ?), ?, ?, ?, ?, ?, ?)`,
        )
        .bind(...row),
    ),
    db
      .prepare("INSERT OR IGNORE INTO app_meta (key, value) VALUES (?, ?)")
      .bind("demo_appointments_v1", new Date().toISOString()),
  ]);
}

export async function GET() {
  try {
    await seedDemoData();
    await seedAppointmentData();
    const db = getD1();
    const [summary, alarmCount, equipment, workOrders, alarms, readings, appointments] =
      await db.batch([
        db.prepare(
          `SELECT
             COUNT(*) AS totalAssets,
             SUM(CASE WHEN status = 'Online' THEN 1 ELSE 0 END) AS onlineAssets,
             ROUND(AVG(health_score)) AS avgHealth,
             ROUND(SUM(energy_kw), 1) AS totalEnergy
           FROM equipment`,
        ),
        db.prepare("SELECT COUNT(*) AS activeAlarms FROM alarms WHERE status = 'Active'"),
        db.prepare(
          `SELECT id, name, type, location, status, health_score AS healthScore,
                  zone_temp AS zoneTemp, supply_temp AS supplyTemp,
                  static_pressure AS staticPressure, runtime_hours AS runtimeHours,
                  energy_kw AS energyKw, last_service AS lastService
           FROM equipment ORDER BY name`,
        ),
        db.prepare(
          `SELECT w.id, w.code, w.title, w.priority, w.status, w.assignee,
                  w.due_date AS dueDate, w.notes, w.created_at AS createdAt,
                  e.name AS equipmentName
           FROM work_orders w
           JOIN equipment e ON e.id = w.equipment_id
           ORDER BY CASE w.status WHEN 'In Progress' THEN 1 WHEN 'Open' THEN 2 ELSE 3 END,
                    w.due_date, w.id DESC`,
        ),
        db.prepare(
          `SELECT a.id, a.code, a.severity, a.message, a.status,
                  a.created_at AS createdAt, e.name AS equipmentName
           FROM alarms a
           JOIN equipment e ON e.id = a.equipment_id
           ORDER BY CASE a.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END,
                    a.id DESC`,
        ),
        db.prepare(
          `SELECT recorded_at AS time, zone_temp AS zoneTemp,
                  supply_temp AS supplyTemp, demand
           FROM sensor_readings
           WHERE equipment_id = (SELECT id FROM equipment WHERE name = 'RTU-12')
           ORDER BY recorded_at`,
        ),
        db.prepare(
          `SELECT s.id, s.title, s.service_date AS serviceDate,
                  s.start_time AS startTime, s.end_time AS endTime,
                  s.technician, s.status, s.notes, s.created_at AS createdAt,
                  e.name AS equipmentName, e.location
           FROM service_appointments s
           JOIN equipment e ON e.id = s.equipment_id
           ORDER BY s.service_date, s.start_time, s.id`,
        ),
      ]);

    const summaryRow = (summary.results[0] ?? {}) as Record<string, number>;
    const alarmRow = (alarmCount.results[0] ?? {}) as Record<string, number>;

    return Response.json({
      summary: { ...summaryRow, ...alarmRow },
      equipment: equipment.results,
      workOrders: workOrders.results,
      alarms: alarms.results,
      readings: readings.results,
      appointments: appointments.results,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    const db = getD1();

    if (action === "create_work_order") {
      const title = String(body.title ?? "").trim();
      const equipmentId = Number(body.equipmentId);
      const priority = String(body.priority ?? "Medium");
      const dueDate = String(body.dueDate ?? "").trim() || null;
      const notes = String(body.notes ?? "").trim();

      if (!title || title.length > 120 || !Number.isInteger(equipmentId)) {
        return Response.json({ error: "A valid title and equipment selection are required." }, { status: 400 });
      }
      if (!["Low", "Medium", "High", "Critical"].includes(priority)) {
        return Response.json({ error: "Invalid priority." }, { status: 400 });
      }

      const code = `WO-${Date.now().toString().slice(-7)}`;
      await db
        .prepare(
          `INSERT INTO work_orders
            (code, equipment_id, title, priority, status, assignee, due_date, notes)
           VALUES (?, ?, ?, ?, 'Open', 'AJ', ?, ?)`,
        )
        .bind(code, equipmentId, title, priority, dueDate, notes)
        .run();

      return Response.json({ ok: true, code }, { status: 201 });
    }

    if (action === "create_service_appointment") {
      const title = String(body.title ?? "").trim();
      const equipmentId = Number(body.equipmentId);
      const serviceDate = String(body.serviceDate ?? "").trim();
      const startTime = String(body.startTime ?? "").trim();
      const endTime = String(body.endTime ?? "").trim();
      const technician = String(body.technician ?? "AJ").trim();
      const notes = String(body.notes ?? "").trim();
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

      if (!title || title.length > 120 || !Number.isInteger(equipmentId)) {
        return Response.json({ error: "A valid title and equipment selection are required." }, { status: 400 });
      }
      if (!datePattern.test(serviceDate) || !timePattern.test(startTime) || !timePattern.test(endTime) || endTime <= startTime) {
        return Response.json({ error: "Enter a valid date and an end time after the start time." }, { status: 400 });
      }
      if (!technician || technician.length > 80 || notes.length > 600) {
        return Response.json({ error: "Technician or notes are invalid." }, { status: 400 });
      }

      const result = await db
        .prepare(
          `INSERT INTO service_appointments
            (equipment_id, title, service_date, start_time, end_time, technician, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, 'Scheduled', ?)`,
        )
        .bind(equipmentId, title, serviceDate, startTime, endTime, technician, notes)
        .run();

      return Response.json({ ok: true, id: result.meta.last_row_id }, { status: 201 });
    }

    if (action === "update_equipment_status") {
      const id = Number(body.id);
      const status = String(body.status ?? "");
      if (!Number.isInteger(id) || !["Online", "Service", "Offline"].includes(status)) {
        return Response.json({ error: "Invalid equipment update." }, { status: 400 });
      }

      await db
        .prepare("UPDATE equipment SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(status, id)
        .run();
      return Response.json({ ok: true });
    }

    if (action === "update_work_order") {
      const id = Number(body.id);
      const status = String(body.status ?? "");
      if (!Number.isInteger(id) || !["Open", "In Progress", "Completed"].includes(status)) {
        return Response.json({ error: "Invalid work order update." }, { status: 400 });
      }

      await db
        .prepare("UPDATE work_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(status, id)
        .run();
      return Response.json({ ok: true });
    }

    if (action === "update_appointment_status") {
      const id = Number(body.id);
      const status = String(body.status ?? "");
      if (!Number.isInteger(id) || !["Scheduled", "In Progress", "Completed", "Cancelled"].includes(status)) {
        return Response.json({ error: "Invalid appointment update." }, { status: 400 });
      }

      await db
        .prepare("UPDATE service_appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(status, id)
        .run();
      return Response.json({ ok: true });
    }

    if (action === "acknowledge_alarm") {
      const id = Number(body.id);
      if (!Number.isInteger(id)) {
        return Response.json({ error: "Invalid alarm." }, { status: 400 });
      }

      await db
        .prepare(
          "UPDATE alarms SET status = 'Acknowledged', acknowledged_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
        .bind(id)
        .run();
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
