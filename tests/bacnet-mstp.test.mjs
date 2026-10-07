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
const { diagnoseMstp } = await vite.ssrLoadModule("/lib/bacnet-mstp.ts");

test("MS/TP diagnosis prioritizes duplicate MAC and baud mismatch", () => {
  const duplicate = diagnoseMstp({ symptom: "intermittent", idleBiasVoltage: "0.4", terminationCount: "2", baudMatches: "yes", duplicateMac: "yes" });
  assert.equal(duplicate.status, "Duplicate MAC likely");
  assert.equal(duplicate.severity, "Critical");
  assert.ok(duplicate.checks.some((check) => check.includes("readdress")));

  const baud = diagnoseMstp({ symptom: "one-offline", idleBiasVoltage: "0.6", terminationCount: "2", baudMatches: "no", duplicateMac: "no" });
  assert.equal(baud.status, "Baud mismatch likely");
  assert.ok(baud.checks.some((check) => check.includes("same baud rate")));
});

test("MS/TP diagnosis flags weak bias and termination problems", () => {
  const result = diagnoseMstp({ symptom: "all-offline", idleBiasVoltage: "0.05", terminationCount: "1", baudMatches: "unknown", duplicateMac: "unknown" });
  assert.equal(result.status, "Termination issue likely");
  assert.equal(result.severity, "Critical");
  assert.match(result.readingNote, /very low differential/);
  assert.ok(result.checks.some((check) => check.includes("Correct termination count")));
  assert.ok(result.checks.some((check) => check.includes("Measure the data pair")));
});

test("MS/TP diagnosis handles invalid and missing voltage readings", () => {
  const invalid = diagnoseMstp({ symptom: "slow-token", idleBiasVoltage: "0.4 V", terminationCount: "2", baudMatches: "yes", duplicateMac: "no" });
  assert.match(invalid.readingNote, /decimal number/);

  const missing = diagnoseMstp({ symptom: "slow-token", idleBiasVoltage: "", terminationCount: "2", baudMatches: "unknown", duplicateMac: "unknown" });
  assert.ok(missing.checks.some((check) => check.includes("Measure idle differential voltage")));
  assert.ok(missing.checks.some((check) => check.includes("max master")));
});

test("BACnet MS/TP route renders and tools page links to it", async () => {
  const { default: BacnetPage } = await vite.ssrLoadModule("/app/tools/bacnet-mstp/page.tsx");
  const bacnetHtml = renderToStaticMarkup(React.createElement(BacnetPage));
  assert.match(bacnetHtml, /BACnet MS\/TP Checkout Tool/);
  assert.match(bacnetHtml, /for="mstp-bias"/);
  assert.match(bacnetHtml, /Best diagnostic path/);

  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const toolsHtml = renderToStaticMarkup(React.createElement(ToolsPage));
  assert.match(toolsHtml, /href="\/tools\/bacnet-mstp"/);
});
