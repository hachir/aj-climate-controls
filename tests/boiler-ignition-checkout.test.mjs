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
const { diagnoseBoilerIgnition } = await vite.ssrLoadModule("/lib/boiler-ignition-checkout.ts");

const base = { role: "member", enablePresent: "yes", callForHeat: "yes", lockoutActive: "no", prePurgeObserved: "yes", ignitionAttemptObserved: "yes", flameProven: "yes", gasPressureVerified: "yes" };

test("boiler checkout recognizes a completed ignition sequence", () => {
  const result = diagnoseBoilerIgnition(base);
  assert.equal(result.status, "Flame proven");
  assert.equal(result.severity, "Running");
  assert.ok(result.checks.some((check) => check.includes("cascade status")));
});

test("boiler checkout isolates enable and sequence failures", () => {
  const enable = diagnoseBoilerIgnition({ ...base, enablePresent: "no", flameProven: "no" });
  assert.equal(enable.status, "No enable at boiler");
  assert.ok(enable.checks.some((check) => check.includes("jumper")));
  const purge = diagnoseBoilerIgnition({ ...base, prePurgeObserved: "no", ignitionAttemptObserved: "no", flameProven: "no" });
  assert.equal(purge.status, "Sequence stops before pre-purge");
  assert.equal(purge.severity, "Stop");
});

test("boiler checkout stops at failed flame proving without prescribing gas pressure", () => {
  const result = diagnoseBoilerIgnition({ ...base, lockoutActive: "yes", flameProven: "no", gasPressureVerified: "unknown" });
  assert.equal(result.status, "Ignition attempted; flame not proven");
  assert.equal(result.severity, "Stop");
  assert.ok(result.checks.some((check) => check.includes("exact lockout")));
  assert.ok(result.checks.some((check) => check.includes("exact boiler nameplate")));
  assert.ok(result.checks.every((check) => !/\d+\s*(?:in\.?\s*w\.?c\.?|psi)/i.test(check)));
});

test("boiler ignition route renders and tools directory links to it", async () => {
  const { default: Page } = await vite.ssrLoadModule("/app/tools/boiler-ignition-checkout/page.tsx");
  const pageHtml = renderToStaticMarkup(React.createElement(Page));
  assert.match(pageHtml, /Boiler Ignition Checkout Tool/);
  assert.match(pageHtml, /for="ignition-attempt"/);
  assert.match(pageHtml, /Gas pressure and combustion settings are model-specific/);
  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  assert.match(renderToStaticMarkup(React.createElement(ToolsPage)), /href="\/tools\/boiler-ignition-checkout"/);
});
