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
const { diagnoseVfdCheckout } = await vite.ssrLoadModule("/lib/vfd-checkout.ts");

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
});

test("VFD checkout prioritizes active faults and open permissives", () => {
  const fault = diagnoseVfdCheckout({ ...base, faulted: "yes" });
  assert.equal(fault.status, "Drive fault must be cleared");
  assert.equal(fault.severity, "Stop");
  assert.ok(fault.checks.some((check) => check.includes("fault code")));

  const permissive = diagnoseVfdCheckout({ ...base, permissiveClosed: "no" });
  assert.equal(permissive.status, "Safety or permissive open");
  assert.equal(permissive.severity, "Warning");
  assert.ok(permissive.checks.some((check) => check.includes("smoke shutdown")));
});

test("VFD checkout catches local mode, missing run command and bad reference values", () => {
  const local = diagnoseVfdCheckout({ ...base, mode: "local" });
  assert.equal(local.status, "Drive left in Local");
  assert.ok(local.checks.some((check) => check.includes("Remote/Auto")));

  const noRun = diagnoseVfdCheckout({ ...base, runCommand: "no" });
  assert.equal(noRun.status, "No run command");
  assert.ok(noRun.checks.some((check) => check.includes("BAS output relay")));

  const invalid = diagnoseVfdCheckout({ ...base, speedReference: "4.8 V" });
  assert.match(invalid.readingNote, /decimal voltage/);

  const outOfRange = diagnoseVfdCheckout({ ...base, speedReference: "20" });
  assert.equal(outOfRange.status, "Reference out of range");
  assert.equal(outOfRange.referencePercent, null);
});

test("VFD checkout route renders and tools page links to it", async () => {
  const { default: VfdPage } = await vite.ssrLoadModule("/app/tools/vfd-checkout/page.tsx");
  const vfdHtml = renderToStaticMarkup(React.createElement(VfdPage));
  assert.match(vfdHtml, /VFD Checkout Tool/);
  assert.match(vfdHtml, /for="vfd-reference"/);
  assert.match(vfdHtml, /Best diagnostic path/);

  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const toolsHtml = renderToStaticMarkup(React.createElement(ToolsPage));
  assert.match(toolsHtml, /href="\/tools\/vfd-checkout"/);
});
