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

test("tool search accepts compact signal units and equivalent range spelling", () => {
  const hrefs = (query) => searchTools(query).map((tool) => tool.href);
  for (const query of ["4-20mA", "4–20mA", "4 to 20 mA", "4 - 20 MA"]) {
    assert.deepEqual(hrefs(query), ["/tools/signal-converter"], query);
  }
  for (const query of ["0-10V", "0–10VDC", "0 to 10 V", "0-10 VDC"]) {
    assert.deepEqual(hrefs(query), hrefs("0-10 VDC"), query);
  }
  assert.deepEqual(hrefs("2-10V"), hrefs("2-10 VDC"));
  assert.deepEqual(hrefs("4-20VAC"), []);
  assert.deepEqual(hrefs("4-20mA boiler"), []);
});

test("tool search finds recently added address planning and report features", () => {
  assert.equal(searchTools("address planner")[0].href, "/tools/bacnet-mstp");
  assert.equal(searchTools("BACnet report")[0].href, "/tools/bacnet-mstp");
  assert.equal(searchTools("VFD field report")[0].href, "/tools/vfd-checkout");
});

test("tools page renders accessible search, all destination links and calculator target", async () => {
  const { default: Page } = await vite.ssrLoadModule("/app/tools/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.match(html, /for="tool-search"/);
  assert.match(html, /aria-controls="tool-search-results"/);
  assert.match(html, /id="field-calculators"/);
  for (const tool of toolDirectory) assert.ok(html.includes(`href="${tool.href}"`), tool.href);
});
