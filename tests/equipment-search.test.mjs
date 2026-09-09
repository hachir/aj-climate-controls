import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root,
  server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { filterEquipment } = await vite.ssrLoadModule("/lib/equipment-search.ts");
const equipment = [
  { id: 1, name: "RTU-01", type: "Rooftop unit", location: "North roof", status: "Online" },
  { id: 2, name: "AHU-02", type: "Air handler", location: "South mechanical room", status: "Service" },
];

test("empty search restores all equipment in its original order", () => {
  assert.deepEqual(filterEquipment(equipment, "  \t "), equipment);
  assert.deepEqual(filterEquipment([], "north"), []);
});

test("finds names, types and locations regardless of case", () => {
  for (const query of ["rtu-01", "ROOFTOP", " north ", "ROOF rtu-01"])
    assert.deepEqual(filterEquipment(equipment, query).map(item => item.id), [1]);
  assert.deepEqual(filterEquipment(equipment, "handler south").map(item => item.id), [2]);
});

test("all terms must match the same equipment without changing source records", () => {
  const original = structuredClone(equipment);
  assert.deepEqual(filterEquipment(equipment, "RTU south"), []);
  assert.deepEqual(filterEquipment(equipment, "["), []);
  assert.deepEqual(equipment, original);
});

test("status filtering works alone and together with search", () => {
  assert.deepEqual(filterEquipment(equipment, "", "Service").map(item => item.id), [2]);
  assert.deepEqual(filterEquipment(equipment, "north", "Online").map(item => item.id), [1]);
  assert.deepEqual(filterEquipment(equipment, "north", "Service"), []);
  assert.deepEqual(filterEquipment(equipment, "", "Offline"), []);
  assert.deepEqual(filterEquipment(equipment, "", "All"), equipment);
});

test("changed equipment status is reflected without mutating the source", () => {
  const updated = equipment.map(item => item.id === 1 ? { ...item, status: "Offline" } : item);
  assert.deepEqual(filterEquipment(updated, "", "Online"), []);
  assert.deepEqual(filterEquipment(updated, "", "Offline").map(item => item.id), [1]);
  assert.equal(equipment[0].status, "Online");
});
