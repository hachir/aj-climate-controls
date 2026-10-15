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
const { diagnoseFireAlarmShutdown } = await vite.ssrLoadModule("/lib/fire-alarm-shutdown.ts");

const verified = {
  contactAction: "opens-on-alarm",
  normalInputState: "on",
  alarmInputState: "off",
  shutdownObserved: "yes",
  allDrivesMatched: "yes",
  programmedInput: "yes",
  driveMode: "auto",
};

test("fire alarm shutdown diagnosis verifies a complete successful test", () => {
  const result = diagnoseFireAlarmShutdown(verified);
  assert.equal(result.status, "Shutdown verified");
  assert.equal(result.severity, "Verified");
  assert.ok(result.checks.some((check) => check.includes("Record normal input state")));
});

test("fire alarm shutdown diagnosis catches wiring and programming failures", () => {
  const noChange = diagnoseFireAlarmShutdown({ ...verified, normalInputState: "on", alarmInputState: "on" });
  assert.equal(noChange.status, "Input state did not change");
  assert.equal(noChange.severity, "Stop");
  assert.ok(noChange.checks.some((check) => check.includes("dry contact")));

  const changedNoShutdown = diagnoseFireAlarmShutdown({ ...verified, shutdownObserved: "no" });
  assert.equal(changedNoShutdown.status, "Programming or polarity mismatch");
  assert.ok(changedNoShutdown.checks.some((check) => check.includes("input function")));
});

test("fire alarm shutdown diagnosis flags incomplete programming and inconsistent drives", () => {
  const notProgrammed = diagnoseFireAlarmShutdown({ ...verified, programmedInput: "no" });
  assert.equal(notProgrammed.status, "Input not programmed");
  assert.equal(notProgrammed.severity, "Stop");

  const inconsistent = diagnoseFireAlarmShutdown({ ...verified, allDrivesMatched: "no" });
  assert.equal(inconsistent.status, "Drives are not consistent");
  assert.ok(inconsistent.checks.some((check) => check.includes("each VFD")));
});

test("fire alarm shutdown route renders and tools page links to it", async () => {
  const { default: FireAlarmPage } = await vite.ssrLoadModule("/app/tools/fire-alarm-shutdown/page.tsx");
  const pageHtml = renderToStaticMarkup(React.createElement(FireAlarmPage));
  assert.match(pageHtml, /Fire Alarm Shutdown Checkout Tool/);
  assert.match(pageHtml, /for="alarm-state"/);
  assert.match(pageHtml, /Best diagnostic path/);

  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const toolsHtml = renderToStaticMarkup(React.createElement(ToolsPage));
  assert.match(toolsHtml, /href="\/tools\/fire-alarm-shutdown"/);
});
