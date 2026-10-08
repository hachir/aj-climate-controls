import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { unstable_dev } from "wrangler";

test("production Worker renders the dashboard and HVAC tools", async () => {
  // cloudflare: modules need workerd rather than Node's ESM loader.
  // Production pages do not emit development-only preview metadata.
  const worker = await unstable_dev(fileURLToPath(new URL("../dist/server/index.js", import.meta.url)), {
    config: fileURLToPath(new URL("../dist/server/wrangler.json", import.meta.url)),
    local: true, port: 0, inspectorPort: 0, persist: false, logLevel: "error",
    experimental: { disableExperimentalWarning: true, disableDevRegistry: true, watch: false },
  });
  try {
    for (const [route, expected] of [
      ["/", /AJ Climate/],
      ["/tools", /href="\/tools\/voltage-troubleshooter"/],
      ["/tools/voltage-troubleshooter", /0–10 VDC Output Troubleshooting Tool/],
      ["/tools/signal-converter", /Control Signal Converter/],
      ["/tools/bacnet-mstp", /BACnet MS\/TP Checkout Tool/],
      ["/tools/vfd-checkout", /VFD Checkout Tool/],
    ]) {
      const response = await worker.fetch(route, { headers: { accept: "text/html" } });
      assert.equal(response.status, 200, route);
      assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
      assert.match(await response.text(), expected, route);
    }
  } finally {
    await worker.stop();
  }
});
