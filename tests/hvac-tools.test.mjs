import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root,
  resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { readMeasurement, convertTemperature, temperatureDifference, ductAirflow, convertCapacity } =
  await vite.ssrLoadModule("/lib/hvac.ts");
const near = (actual, expected, tolerance = 0.00001) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

test("empty and nonfinite readings do not become zero", () => {
  for (const input of ["", " ", "abc", "Infinity", "1e999"]) assert.equal(readMeasurement(input), null);
  assert.equal(readMeasurement("0"), 0);
  assert.equal(readMeasurement("-12.5"), -12.5);
});

test("cooling drop and heating rise use the correct measurement direction", () => {
  assert.equal(temperatureDifference("split", 75, 55, "F"), 20);
  assert.equal(temperatureDifference("split", 70, 115, "F", "heating"), 45);
  assert.equal(temperatureDifference("split", 55, 75, "F"), -20);
  assert.equal(temperatureDifference("split", 55, 55, "F"), 0);
});

test("refrigerant calculations preserve negative temperatures and signed results", () => {
  assert.equal(temperatureDifference("superheat", 52, 40, "F"), 12);
  assert.equal(temperatureDifference("superheat", -10, -20, "C"), 10);
  assert.equal(temperatureDifference("superheat", 35, 40, "F"), -5);
  assert.equal(temperatureDifference("subcooling", 105, 95, "F"), 10);
  assert.equal(temperatureDifference("subcooling", 95, 105, "F"), -10);
});

test("unit changes convert readings with an offset and differences without it", () => {
  near(convertTemperature(32, "F", "C"), 0);
  near(convertTemperature(100, "C", "F"), 212);
  near(temperatureDifference("superheat", convertTemperature(52, "F", "C"), convertTemperature(40, "F", "C"), "C"), 12 * 5 / 9);
  assert.equal(temperatureDifference("split", null, 55, "F"), null);
  assert.equal(temperatureDifference("split", -274, 0, "C"), null);
  assert.equal(temperatureDifference("split", -460, 0, "F"), null);
  assert.equal(temperatureDifference("split", Infinity, 0, "C"), null);
});

test("round and rectangular airflow match field examples", () => {
  near(ductAirflow("round", "imperial", 700, 12).cfm, 549.778714378);
  near(ductAirflow("rectangular", "imperial", 800, 20, 10).cfm, 1111.111111111);
  const imperial = ductAirflow("round", "imperial", 700, 12);
  const metric = ductAirflow("round", "metric", 3.556, 304.8);
  near(imperial.cfm, metric.cfm);
  near(imperial.litersPerSecond, metric.litersPerSecond);
  near(ductAirflow("rectangular", "metric", 2, 500, 200).litersPerSecond, 200);
});

test("airflow allows a stopped fan and rejects invalid dimensions", () => {
  assert.equal(ductAirflow("round", "imperial", 0, 12).cfm, 0);
  for (const dimension of [null, 0, -1, Infinity, NaN]) assert.equal(ductAirflow("round", "imperial", 700, dimension), null);
  assert.equal(ductAirflow("rectangular", "imperial", 700, 12), null);
  assert.equal(ductAirflow("round", "imperial", -1, 12), null);
  assert.equal(ductAirflow("round", "imperial", 1e308, 1e308), null);
});

test("capacity conversions are consistent across all input units", () => {
  const result = convertCapacity(36000, "btu");
  assert.equal(result.tons, 3);
  near(result.kw, 10.5505585262);
  near(convertCapacity(3, "tons").btu, 36000);
  near(convertCapacity(result.kw, "kw").tons, 3);
  assert.deepEqual(convertCapacity(0, "kw"), { btu: 0, tons: 0, kw: 0 });
  for (const value of [null, -1, Infinity, NaN, 1e308]) assert.equal(convertCapacity(value, "tons"), null);
});

test("tool page renders without dashboard data and begins with empty results", async () => {
  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const html = renderToStaticMarkup(React.createElement(ToolsPage));
  assert.match(html, /HVAC tools/);
  assert.match(html, /Back to dashboard/);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.equal((html.match(/aria-controls="hvac-panel-/g) ?? []).length, 5);
  assert.match(html, /Enter valid readings to see the result/);
  assert.match(html, /Saturation temperature \(dew\)/);
  assert.match(html, /Saturation temperature \(bubble\)/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
