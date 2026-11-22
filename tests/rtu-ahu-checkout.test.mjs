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
const { diagnoseRtuAhu } = await vite.ssrLoadModule("/lib/rtu-ahu-checkout.ts");

const coolingBase = {
  unitType: "rtu",
  complaint: "no-cooling",
  fanRunning: "yes",
  callPresent: "yes",
  safetyClosed: "yes",
  supplyTemp: "55",
  returnTemp: "74",
};

test("RTU/AHU checkout classifies cooling split and heating rise", () => {
  const cooling = diagnoseRtuAhu(coolingBase);
  assert.equal(cooling.status, "Cooling split looks normal");
  assert.equal(cooling.temperatureDelta, 19);
  assert.match(cooling.readingNote, /cooling split/);

  const heating = diagnoseRtuAhu({ ...coolingBase, complaint: "no-heating", supplyTemp: "95", returnTemp: "70" });
  assert.equal(heating.status, "Heat rise looks normal");
  assert.equal(heating.temperatureDelta, 25);
});

test("RTU/AHU checkout prioritizes safety, fan and BAS call problems", () => {
  const safety = diagnoseRtuAhu({ ...coolingBase, safetyClosed: "no" });
  assert.equal(safety.status, "Safety circuit open");
  assert.equal(safety.severity, "Stop");
  assert.ok(safety.checks.some((check) => check.includes("smoke shutdown")));

  const fan = diagnoseRtuAhu({ ...coolingBase, fanRunning: "no" });
  assert.equal(fan.status, "Fan not proven");
  assert.equal(fan.severity, "Warning");
  assert.ok(fan.checks.some((check) => check.includes("VFD")));

  const noCall = diagnoseRtuAhu({ ...coolingBase, callPresent: "no" });
  assert.equal(noCall.status, "No BAS call present");
  assert.ok(noCall.checks.some((check) => check.includes("occupancy schedule")));
});

test("an open safety keeps its Stop headline and summary when other observations also fail", () => {
  for (const unitType of ["rtu", "ahu"]) {
    for (const complaint of ["no-cooling", "no-heating", "fan-not-running", "poor-airflow"]) {
      for (const fanRunning of ["yes", "no", "unknown"]) {
        for (const callPresent of ["yes", "no", "unknown"]) {
          const result = diagnoseRtuAhu({ ...coolingBase, unitType, complaint,
            safetyClosed: "no", fanRunning, callPresent });
          assert.equal(result.status, "Safety circuit open");
          assert.equal(result.severity, "Stop");
          assert.match(result.summary, /An open safety must be identified/);
          assert.ok(result.checks.some((check) => check.includes("smoke shutdown")));
          if (fanRunning === "no") assert.ok(result.checks.some((check) => check.includes("airflow proof")));
          if (callPresent === "no") assert.ok(result.checks.some((check) => check.includes("occupancy schedule")));
        }
      }
    }
  }
});

test("missing or invalid temperatures cannot hide an open safety", () => {
  for (const supplyTemp of ["", "55 F"]) {
    const result = diagnoseRtuAhu({ ...coolingBase, supplyTemp, safetyClosed: "no", fanRunning: "no", callPresent: "no" });
    assert.equal(result.status, "Safety circuit open");
    assert.equal(result.severity, "Stop");
    assert.equal(result.temperatureDelta, null);
    assert.match(result.summary, /An open safety must be identified/);
  }
});

test("RTU/AHU checkout handles invalid and missing temperatures", () => {
  const invalid = diagnoseRtuAhu({ ...coolingBase, supplyTemp: "55 F" });
  assert.match(invalid.readingNote, /decimal numbers/);

  const missing = diagnoseRtuAhu({ ...coolingBase, supplyTemp: "", returnTemp: "" });
  assert.equal(missing.temperatureDelta, null);
  assert.ok(missing.checks.some((check) => check.includes("Measure supply and return")));
});

test("RTU/AHU checkout route renders and tools page links to it", async () => {
  const { default: RtuAhuPage } = await vite.ssrLoadModule("/app/tools/rtu-ahu-checkout/page.tsx");
  const pageHtml = renderToStaticMarkup(React.createElement(RtuAhuPage));
  assert.match(pageHtml, /RTU\/AHU Checkout Tool/);
  assert.match(pageHtml, /for="supply-temp"/);
  assert.match(pageHtml, /Best diagnostic path/);

  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const toolsHtml = renderToStaticMarkup(React.createElement(ToolsPage));
  assert.match(toolsHtml, /href="\/tools\/rtu-ahu-checkout"/);
});
