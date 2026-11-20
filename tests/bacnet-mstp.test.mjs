import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root,
  resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { diagnoseMstp } = await vite.ssrLoadModule("/lib/bacnet-mstp.ts");
const { buildAddressPlanReport, checkAddressPlan } = await vite.ssrLoadModule("/lib/mstp-address-plan.ts");

const row = (trunk, mac, instance, device = "") => ({ trunk, mac, instance, device });

test("empty address plan exposes a disabled clear confirmation trigger", async () => {
  const { MstpAddressPlan } = await vite.ssrLoadModule("/components/mstp-address-plan.tsx");
  const html = renderToStaticMarkup(React.createElement(MstpAddressPlan));
  assert.match(html, /<button[^>]*disabled=""[^>]*aria-haspopup="dialog"[^>]*>Clear plan<\/button>/);
});

test("clearing the address plan requires the explicit confirmation action", async () => {
  const source = await readFile(new URL("../components/mstp-address-plan.tsx", import.meta.url), "utf8");
  assert.match(source, /<AlertDialogCancel>Keep plan<\/AlertDialogCancel>/);
  assert.match(source, /<AlertDialogAction[^>]*onClick=\{\(\) => replaceRows\(\[emptyAddressRow\]\)\}>Clear all rows/);
  assert.doesNotMatch(source, /<Button[^>]*onClick=\{\(\) => replaceRows\(\[emptyAddressRow\]\)/);
});

test("address report preserves row numbers, entered zeros and unresolved issues", () => {
  const rows = [row("", "", ""), row("A", "0", "12", "DEMO\nDEVICE"), row("A", "00", "", "")];
  const before = structuredClone(rows);
  const report = buildAddressPlanReport(rows);
  assert.match(report, /Entered devices: 2/);
  assert.match(report, /Row 2 — Device: DEMO DEVICE/);
  assert.match(report, /Trunk: A \| MAC: 0 \| Device instance: 12/);
  assert.match(report, /Row 3: enter the device instance/);
  assert.match(report, /MAC 0 repeats/);
  assert.match(report, /MAC: 00/);
  assert.match(report, /Not a live network scan/);
  assert.deepEqual(rows, before);
});

test("address report labels examples, empty plans and invalid entries honestly", () => {
  assert.match(buildAddressPlanReport([], true), /^EXAMPLE ONLY/);
  assert.match(buildAddressPlanReport([]), /No devices entered/);
  const invalid = buildAddressPlanReport([row("A", "255", "12")]);
  assert.match(invalid, /MAC: 255/);
  assert.match(invalid, /must be a whole number/);
  assert.doesNotMatch(invalid, /No conflicts found/);
  assert.match(buildAddressPlanReport([row("A", "0", "0")]), /No conflicts found in the entered devices/);
});

test("address planner scopes MAC conflicts to a trunk and instance conflicts across trunks", () => {
  const result = checkAddressPlan([
    row(" Trunk   A ", "012", "12012"),
    row("trunk a", "12", "12013"),
    row("Trunk B", "12", "012012"),
  ]);
  assert.equal(result.entered, 3);
  assert.deepEqual(result.issues.map(({ field, rows }) => [field, rows]), [
    ["mac", [1, 2]], ["instance", [1, 3]],
  ]);
  assert.deepEqual(checkAddressPlan([row("A", "12", "12012"), row("B", "12", "12013")]).issues, []);
});

test("address planner checks valid whole-number limits including zero", () => {
  assert.deepEqual(checkAddressPlan([row("A", "0", "0"), row("A", "254", "4194302")]).issues, []);
  for (const mac of ["255", "-1", "1.2", "0x10", "1e2", "999999999999"]) {
    assert.equal(checkAddressPlan([row("A", mac, "12")]).issues[0].kind, "invalid", mac);
  }
  assert.equal(checkAddressPlan([row("A", "12", "4194303")]).issues[0].field, "instance");
});

test("address planner ignores blank rows and reports missing fields without treating them as zero", () => {
  const result = checkAddressPlan([row("", "", ""), row("", "", "", "DEMO"), row("B", "0", "0")]);
  assert.equal(result.entered, 2);
  assert.deepEqual(result.issues.map(({ kind, rows, field }) => [kind, rows, field]), [
    ["missing", [2], "trunk"], ["missing", [2], "mac"], ["missing", [2], "instance"],
  ]);
});

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
  assert.match(bacnetHtml, /href="#mstp-address-plan"/);
  assert.match(bacnetHtml, /MS\/TP address planner/);
  assert.match(bacnetHtml, /for="mstp-plan-0-instance"/);
  assert.match(bacnetHtml, /Load conflict example/);
  assert.match(bacnetHtml, /Address plan report/);
  assert.match(bacnetHtml, /Copy address plan/);
  assert.match(bacnetHtml, /for="mstp-plan-report"/);

  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const toolsHtml = renderToStaticMarkup(React.createElement(ToolsPage));
  assert.match(toolsHtml, /href="\/tools\/bacnet-mstp"/);
});
