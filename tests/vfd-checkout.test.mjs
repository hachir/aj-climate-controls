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
const { buildVfdReport, diagnoseVfdCheckout } = await vite.ssrLoadModule("/lib/vfd-checkout.ts");

const base = {
  driveFamily: "yaskawa-j1000",
  mode: "auto",
  runCommand: "yes",
  speedReference: "4.8",
  faulted: "no",
  permissiveClosed: "yes",
};

test("VFD checkout confirms a ready command path with good Auto readings", () => {
  const result = diagnoseVfdCheckout(base);
  assert.equal(result.status, "Command path looks ready");
  assert.equal(result.severity, "Guided check");
  assert.equal(result.referencePercent, 48);
  assert.ok(result.checks.some((check) => check.includes("output frequency")));
  assert.ok(result.checks.some((check) => check.includes("b1-01")));
  assert.match(result.summary, /do not prove motor operation/);
});

test("VFD checkout prioritizes active faults and open permissives", () => {
  const fault = diagnoseVfdCheckout({ ...base, faulted: "yes", permissiveClosed: "no", mode: "local", runCommand: "no", speedReference: "20" });
  assert.equal(fault.status, "Active drive fault or alarm");
  assert.equal(fault.severity, "Stop");
  assert.ok(fault.checks.some((check) => check.includes("fault code")));
  assert.ok(fault.checks.some((check) => check.includes("do not bypass")));
  assert.ok(!fault.checks.some((check) => check.includes("b1-01")));
  assert.equal(fault.referencePercent, null);

  const permissive = diagnoseVfdCheckout({ ...base, permissiveClosed: "no", mode: "local", runCommand: "no" });
  assert.equal(permissive.status, "Safety or permissive open");
  assert.equal(permissive.severity, "Warning");
  assert.match(permissive.summary, /Do not bypass/);
});

test("VFD checkout catches local mode, missing run command and bad reference values", () => {
  const local = diagnoseVfdCheckout({ ...base, mode: "local" });
  assert.equal(local.status, "Drive left in Local");
  assert.ok(local.checks.some((check) => check.includes("before any change")));

  const noRun = diagnoseVfdCheckout({ ...base, runCommand: "no" });
  assert.equal(noRun.status, "No run command");
  assert.ok(noRun.checks.some((check) => check.includes("BAS output relay")));

  const invalid = diagnoseVfdCheckout({ ...base, speedReference: "4.8 V" });
  assert.equal(invalid.status, "Invalid speed reference");
  assert.equal(invalid.referencePercent, null);
  assert.match(invalid.readingNote, /decimal voltage/);

  const outOfRange = diagnoseVfdCheckout({ ...base, speedReference: "20" });
  assert.equal(outOfRange.status, "Reference out of range");
  assert.equal(outOfRange.referencePercent, null);
});

test("VFD checkout never treats missing observations as a confirmed command path", () => {
  for (const key of ["mode", "runCommand", "faulted", "permissiveClosed"]) {
    const result = diagnoseVfdCheckout({ ...base, [key]: "unknown" });
    assert.equal(result.status, "Checkout incomplete", key);
  }
  assert.equal(diagnoseVfdCheckout({ ...base, speedReference: "" }).status, "Checkout incomplete");
});

test("VFD checkout labels low references as a screening observation, not a start threshold", () => {
  for (const speedReference of ["0", "0.49"]) {
    const result = diagnoseVfdCheckout({ ...base, speedReference });
    assert.equal(result.status, "Low speed reference");
    assert.equal(result.referencePercent, Number(speedReference) * 10);
    assert.match(result.readingNote, /not a drive start threshold/);
  }
  assert.equal(diagnoseVfdCheckout({ ...base, speedReference: "0.5" }).referencePercent, 5);
  assert.equal(diagnoseVfdCheckout({ ...base, speedReference: "10" }).referencePercent, 100);
  assert.equal(diagnoseVfdCheckout({ ...base, speedReference: "-0.1" }).referencePercent, null);
});

const details = { project: "Demo\nsite", equipment: "FAN-DEMO", testDate: "2026-11-13", faultCode: "DEMO-FAULT", notes: "Observed display.\nFollow-up pending.", example: false };

test("VFD field report preserves the fault, recorded voltage and multiline follow-up", () => {
  const report = buildVfdReport({ ...base, faulted: "yes", runCommand: "no", speedReference: " 0 " }, details);
  assert.match(report, /Site \/ project: Demo site\nEquipment \/ drive tag: FAN-DEMO/);
  assert.match(report, /Test date: 2026-11-13/);
  assert.match(report, /Recorded code: DEMO-FAULT/);
  assert.match(report, /Speed reference: 0 VDC/);
  assert.match(report, /0% \(not motor speed\)/);
  assert.match(report, /Assessment: Stop — Active drive fault or alarm/);
  assert.match(report, /Observed display\.\nFollow-up pending\./);
  assert.match(report, /Not a commissioning sign-off/);
});

test("VFD field report distinguishes missing, invalid and example data", () => {
  const blank = { project: "", equipment: "", testDate: "", faultCode: "", notes: "", example: false };
  const input = { ...base, mode: "unknown", speedReference: "" };
  const report = buildVfdReport(input, blank);
  assert.match(report, /Site \/ project: Not recorded/);
  assert.match(report, /Keypad mode: Not verified/);
  assert.match(report, /Speed reference: Not measured/);
  assert.match(report, /Checkout incomplete/);
  assert.match(buildVfdReport({ ...input, speedReference: "4.8 V" }, blank), /Invalid entry: 4.8 V\nDirect 0–10 VDC span: Not calculated/);
  assert.match(buildVfdReport(base, { ...blank, example: true }), /^EXAMPLE ONLY —/);
});

test("VFD checkout route renders and tools page links to it", async () => {
  const { default: VfdPage } = await vite.ssrLoadModule("/app/tools/vfd-checkout/page.tsx");
  const vfdHtml = renderToStaticMarkup(React.createElement(VfdPage));
  assert.match(vfdHtml, /VFD Checkout Tool/);
  assert.match(vfdHtml, /for="vfd-reference"/);
  assert.match(vfdHtml, /Best diagnostic path/);
  assert.match(vfdHtml, /VFD field checkout report/);
  assert.match(vfdHtml, /for="vfd-report-equipment"/);
  assert.match(vfdHtml, /<textarea[^>]*id="vfd-report-preview"[^>]*readonly=""/i);
  assert.match(vfdHtml, /Copy field report/);

  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const toolsHtml = renderToStaticMarkup(React.createElement(ToolsPage));
  assert.match(toolsHtml, /href="\/tools\/vfd-checkout"/);
});
