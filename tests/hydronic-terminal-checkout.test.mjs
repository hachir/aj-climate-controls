import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { diagnoseHydronicTerminal } = await vite.ssrLoadModule("/lib/hydronic-terminal-checkout.ts");

const working = { terminalType: "unit-heater", callForHeat: "yes", hotWaterAvailable: "yes", valveCommand: "yes", actuatorOpen: "yes", waterFlow: "yes", fanRunning: "yes", spaceWarming: "yes" };

test("hydronic checkout verifies a complete heating path", () => {
  const result = diagnoseHydronicTerminal(working);
  assert.equal(result.status, "Heating path verified");
  assert.equal(result.severity, "Verified");
});

test("hydronic checkout identifies the first failed step", () => {
  assert.equal(diagnoseHydronicTerminal({ ...working, callForHeat: "no", hotWaterAvailable: "no" }).status, "No heat call");
  assert.equal(diagnoseHydronicTerminal({ ...working, hotWaterAvailable: "no", valveCommand: "no" }).status, "No hot water at terminal");
  assert.equal(diagnoseHydronicTerminal({ ...working, valveCommand: "no", actuatorOpen: "no" }).status, "No valve command");
  assert.equal(diagnoseHydronicTerminal({ ...working, actuatorOpen: "no", waterFlow: "no" }).status, "Actuator did not open");
  assert.equal(diagnoseHydronicTerminal({ ...working, waterFlow: "no", fanRunning: "no" }).status, "No water flow through coil");
  assert.equal(diagnoseHydronicTerminal({ ...working, fanRunning: "no" }).status, "Fan not running");
});

test("fin-tube checkout does not require a fan", () => {
  const result = diagnoseHydronicTerminal({ ...working, terminalType: "fin-tube", fanRunning: "no" });
  assert.equal(result.status, "Heating path verified");
  assert.ok(result.checks.every((check) => !check.includes("fan operation")));
});

test("hydronic terminal route renders and tools directory links to it", async () => {
  const { default: Page } = await vite.ssrLoadModule("/app/tools/hydronic-terminal-checkout/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.match(html, /Hydronic Terminal Checkout Tool/);
  assert.match(html, /for="actuator-open"/);
  assert.match(html, /Best diagnostic path/);
  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  assert.match(renderToStaticMarkup(React.createElement(ToolsPage)), /href="\/tools\/hydronic-terminal-checkout"/);
});
