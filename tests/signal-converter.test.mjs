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
const { convertSignal } = await vite.ssrLoadModule("/lib/signal-converter.ts");

test("signal ranges convert to percent and equivalent signals", () => {
  const midVoltage = convertSignal("5", "0-10v");
  assert.equal(midVoltage.status, "Valid signal");
  assert.equal(midVoltage.clampedPercent, 50);
  assert.equal(midVoltage.equivalents.fourToTwentyMa, 12);

  const liveZero = convertSignal("2", "2-10v");
  assert.equal(liveZero.clampedPercent, 0);
  assert.equal(liveZero.equivalents.zeroToTenV, 0);

  const currentLoop = convertSignal("20", "4-20ma");
  assert.equal(currentLoop.status, "Valid signal");
  assert.equal(currentLoop.clampedPercent, 100);
  assert.equal(currentLoop.equivalents.twoToTenV, 10);
});

test("out-of-range readings warn and clamp equivalent displays", () => {
  const high = convertSignal("24", "4-20ma");
  assert.equal(high.status, "Above range");
  assert.match(high.warning, /outside the normal 4-20 mA signal range/);
  assert.equal(high.clampedPercent, 100);
  assert.equal(high.equivalents.zeroToTenV, 10);

  const low = convertSignal("1", "2-10v");
  assert.equal(low.status, "Below range");
  assert.equal(low.clampedPercent, 0);
  assert.equal(low.equivalents.fourToTwentyMa, 4);
});

test("invalid signal readings do not convert", () => {
  for (const reading of ["", " ", "12 mA", "0x10", "NaN", "Infinity", "1,5", "." , "9".repeat(400)]) {
    assert.equal(convertSignal(reading, "0-10v"), null, reading);
  }
});

test("new signal converter route renders and tools page links to it", async () => {
  const { default: ConverterPage } = await vite.ssrLoadModule("/app/tools/signal-converter/page.tsx");
  const converterHtml = renderToStaticMarkup(React.createElement(ConverterPage));
  assert.match(converterHtml, /Control Signal Converter/);
  assert.match(converterHtml, /for="signal-reading"/);
  assert.match(converterHtml, /4-20 mA/);
  assert.match(converterHtml, /Awaiting reading/);

  const { default: ToolsPage } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const toolsHtml = renderToStaticMarkup(React.createElement(ToolsPage));
  assert.match(toolsHtml, /href="\/tools\/signal-converter"/);
});
