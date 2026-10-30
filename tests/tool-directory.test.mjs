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
const { searchTools, toolDirectory } = await vite.ssrLoadModule("/lib/tool-directory.ts");

test("tool search handles case, spacing, punctuation and technical aliases", () => {
  assert.equal(searchTools("  FIRE alarm ")[0].href, "/tools/fire-alarm-shutdown");
  assert.equal(searchTools("MS/TP")[0].href, "/tools/bacnet-mstp");
  assert.equal(searchTools("milliamps")[0].href, "/tools/signal-converter");
  assert.equal(searchTools("CFM")[0].href, "#field-calculators");
  assert.equal(searchTools("superheat")[0].href, "#field-calculators");
  assert.equal(searchTools("flame lockout")[0].href, "/tools/boiler-ignition-checkout");
  assert.equal(searchTools("fin tube actuator")[0].href, "/tools/hydronic-terminal-checkout");
  assert.equal(searchTools("boiler pump flow")[0].href, "/tools/boiler-flow-checkout");
});

test("tool search matches all terms in one tool and restores the full directory", () => {
  assert.deepEqual(searchTools("bacnet superheat"), []);
  assert.deepEqual(searchTools("nonexistent tool"), []);
  assert.deepEqual(searchTools("  "), toolDirectory);
  assert.equal(toolDirectory.length, 10);
});

test("tools page renders accessible search, all destination links and calculator target", async () => {
  const { default: Page } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.match(html, /for="tool-search"/);
  assert.match(html, /aria-controls="tool-search-results"/);
  assert.match(html, /id="field-calculators"/);
  for (const tool of toolDirectory) assert.ok(html.includes(`href="${tool.href}"`), tool.href);
});
