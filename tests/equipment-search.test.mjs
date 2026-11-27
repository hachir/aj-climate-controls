import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root,
  server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { defaultEquipmentView, filterEquipment, isEquipmentViewCustomized } = await vite.ssrLoadModule("/lib/equipment-search.ts");
const equipment = [
  { id: 1, name: "RTU-01", type: "Rooftop unit", location: "North roof", status: "Online" },
  { id: 2, name: "AHU-02", type: "Air handler", location: "South mechanical room", status: "Service" },
];

test("changing only the equipment sort still enables the view reset", () => {
  const { query, status, sort } = defaultEquipmentView;
  assert.equal(isEquipmentViewCustomized(query, status, sort), false);
  for (const order of ["name", "runtime", "health"]) {
    assert.equal(isEquipmentViewCustomized(query, status, order), true);
  }
  assert.equal(isEquipmentViewCustomized("RTU01", status, sort), true);
  assert.equal(isEquipmentViewCustomized(query, "Online", sort), true);
  assert.deepEqual(filterEquipment(equipment, query, status), equipment);
});

test("empty search restores all equipment in its original order", () => {
  assert.deepEqual(filterEquipment(equipment, "  \t "), equipment);
  assert.deepEqual(filterEquipment([], "north"), []);
});

test("finds names, types and locations regardless of case", () => {
  for (const query of ["rtu-01", "ROOFTOP", " north ", "ROOF rtu-01"])
    assert.deepEqual(filterEquipment(equipment, query).map(item => item.id), [1]);
  assert.deepEqual(filterEquipment(equipment, "handler south").map(item => item.id), [2]);
});

test("equipment tags match compact, spaced and dashed spellings", () => {
  const spellings = ["RTU01", "rtu-01", "RTU 01", "RTU–01", "RTU‑01", "RTU_01"];
  for (const name of spellings) {
    const items = [{ ...equipment[0], name }, equipment[1]];
    for (const query of spellings) {
      assert.deepEqual(filterEquipment(items, query).map(item => item.id), [1], `${name}: ${query}`);
    }
  }
  assert.deepEqual(filterEquipment(equipment, "ahu02 south").map(item => item.id), [2]);
});

test("equipment numbers match whole digit groups rather than longer tag numbers", () => {
  const items = ["RTU-01", "RTU-101", "RTU-010"].map((name, index) => ({
    ...equipment[0], id: index + 1, name,
  }));
  const original = structuredClone(items);
  for (const query of ["RTU01", "rtu-01", "RTU 01", "01"]) {
    assert.deepEqual(filterEquipment(items, query).map(item => item.id), [1], query);
  }
  assert.deepEqual(filterEquipment(items, "rtu101").map(item => item.id), [2]);
  assert.deepEqual(filterEquipment(items, "rtu010").map(item => item.id), [3]);
  assert.deepEqual(filterEquipment(items, "rtu1"), []);
  assert.deepEqual(filterEquipment(items, "rtu01", "Service"), []);
  assert.deepEqual(items, original);
});

test("numeric location searches stay exact while ordinary words remain partial matches", () => {
  const items = ["Room 12", "Room 112"].map((location, index) => ({
    ...equipment[1], id: index + 1, location,
  }));
  assert.deepEqual(filterEquipment(items, "room 12").map(item => item.id), [1]);
  assert.deepEqual(filterEquipment(items, "room112").map(item => item.id), [2]);
  assert.deepEqual(filterEquipment(items, "hand room").map(item => item.id), [1, 2]);
});

test("tag normalization preserves status, all-term filtering and source data", () => {
  const original = structuredClone(equipment);
  assert.deepEqual(filterEquipment(equipment, "rtu01 north", "Online").map(item => item.id), [1]);
  assert.deepEqual(filterEquipment(equipment, "rtu01", "Service"), []);
  assert.deepEqual(filterEquipment(equipment, "rtu02"), []);
  assert.deepEqual(filterEquipment(equipment, "rtu01 south"), []);
  assert.deepEqual(filterEquipment(equipment, "["), []);
  assert.deepEqual(equipment, original);
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
