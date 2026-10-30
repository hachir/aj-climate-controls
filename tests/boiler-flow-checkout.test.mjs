import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { diagnoseBoilerFlow } = await vite.ssrLoadModule("/lib/boiler-flow-checkout.ts");

const working = { callForHeat: "yes", boilerFiring: "yes", pumpCommand: "yes", pumpRunning: "yes", isolationValvesOpen: "yes", flowProven: "yes", highLimitActive: "no", supplyTemp: "140", returnTemp: "125" };

test("boiler flow checkout verifies circulation and calculates water delta", () => {
  const result = diagnoseBoilerFlow(working);
  assert.equal(result.status, "Boiler flow path verified");
  assert.equal(result.severity, "Verified");
  assert.equal(result.temperatureDelta, 15);
});

test("high limit takes priority and explains differing temperature readings", () => {
  const result = diagnoseBoilerFlow({ ...working, highLimitActive: "yes", flowProven: "no" });
  assert.equal(result.status, "High limit or over-temperature lockout active");
  assert.equal(result.severity, "Stop");
  assert.ok(result.checks.some((check) => check.includes("independent pipe-temperature")));
});

test("boiler flow checkout identifies the first failed circulation step", () => {
  assert.equal(diagnoseBoilerFlow({ ...working, boilerFiring: "no", pumpCommand: "no" }).status, "Boiler not firing");
  assert.equal(diagnoseBoilerFlow({ ...working, pumpCommand: "no", pumpRunning: "no" }).status, "No pump command");
  assert.equal(diagnoseBoilerFlow({ ...working, pumpRunning: "no", isolationValvesOpen: "no" }).status, "Pump commanded but not running");
  assert.equal(diagnoseBoilerFlow({ ...working, isolationValvesOpen: "no", flowProven: "no" }).status, "Closed valve blocking circulation");
  assert.equal(diagnoseBoilerFlow({ ...working, flowProven: "no" }).status, "Pump running but flow not proven");
});

test("boiler flow checkout validates temperatures and flags reversed readings", () => {
  const invalid = diagnoseBoilerFlow({ ...working, supplyTemp: "140 F" });
  assert.match(invalid.readingNote, /decimal numbers/);
  const reversed = diagnoseBoilerFlow({ ...working, supplyTemp: "120", returnTemp: "140" });
  assert.equal(reversed.temperatureDelta, -20);
  assert.ok(reversed.checks.some((check) => check.includes("Return reads warmer")));
});

test("boiler flow route renders and tools directory links to it", async () => {
  const { default: Page } = await vite.ssrLoadModule("/app/tools/boiler-flow-checkout/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.match(html, /Boiler Flow Checkout Tool/);
  assert.match(html, /for="pump-running"/);
  assert.match(html, /Best diagnostic path/);
  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  assert.match(renderToStaticMarkup(React.createElement(ToolsPage)), /href="\/tools\/boiler-flow-checkout"/);
});
