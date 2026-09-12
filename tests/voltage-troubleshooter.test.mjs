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
const { diagnoseVoltage } = await vite.ssrLoadModule("/lib/voltage-troubleshooter.ts");

test("meter readings classify correctly at each band boundary", () => {
  for (const [reading, expected] of [
    ["0", "Low output"], ["0.5", "Low output"], ["1.999", "Low output"],
    ["2", "Mid-range output"], ["5", "Mid-range output"], ["7.999", "Mid-range output"],
    ["8", "High output"], ["9.999", "High output"], ["10", "Full command"],
    ["10.000001", "Out of range"], ["20", "Out of range"], ["-0.001", "Out of range"],
  ]) assert.equal(diagnoseVoltage(reading)?.status, expected, reading);
});

test("empty, malformed, and nonfinite inputs never produce a diagnosis", () => {
  for (const reading of ["", " ", "abc", "5 V", "0x10", "NaN", "Infinity", "1e999", "1,5", ".", "-", "9".repeat(400)]) {
    assert.equal(diagnoseVoltage(reading), null, reading);
  }
  assert.equal(diagnoseVoltage(" .5 ").voltage, 0.5);
  assert.equal(diagnoseVoltage("+10.0").status, "Full command");
});

test("out-of-range signals always warn and never imply a valid command", () => {
  for (const reading of ["10.000001", "10.01", "20", "24", "999999"]) {
    const result = diagnoseVoltage(reading);
    assert.match(result.warning, /Warning: above 10 VDC/);
    assert.equal(result.commandPercent, null);
    assert.ok(result.checks.some((check) => check.includes("power supply terminals")));
  }
  const negative = diagnoseVoltage("-0.5");
  assert.match(negative.warning, /polarity/);
  assert.equal(negative.commandPercent, null);
});

test("valid span percentages retain zero and include practical next checks", () => {
  for (const [reading, percent] of [["0", 0], ["0.5", 5], ["5", 50], ["10", 100]]) {
    const result = diagnoseVoltage(reading);
    assert.equal(result.commandPercent, percent);
    assert.equal(result.warning, null);
    assert.ok(result.checks.length >= 2);
  }
  assert.match(diagnoseVoltage("0.5").checks.join(" "), /2–10 V/);
  assert.match(diagnoseVoltage("10").checks.join(" "), /VFD run enable/);
});

test("new route renders independently with labeled input and empty live result", async () => {
  const { default: Page } = await vite.ssrLoadModule("/app/tools/voltage-troubleshooter/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.match(html, /0–10 VDC Output Troubleshooting Tool/);
  assert.match(html, /for="voltage-reading"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Awaiting reading/);
  assert.match(html, /href="\/tools"/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test("tools directory links to the voltage troubleshooter", async () => {
  const { default: Page } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.match(html, /href="\/tools\/voltage-troubleshooter"/);
});
