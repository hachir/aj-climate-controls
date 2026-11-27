import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

async function readCssTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return readCssTree(entryPath);
      }
      return entry.name.endsWith(".css") ? readFile(entryPath, "utf8") : "";
    }),
  );
  return contents.join("\n");
}

test("emits the catalog's animation and scrolling utilities", async () => {
  const css = await readCssTree(path.join(root, "dist"));

  assert.match(css, /--tw-enter-opacity/);
  assert.match(css, /scrollbar-width:\s*thin/);
  assert.match(css, /scrollbar-width:\s*none/);
  assert.match(css, /scrollbar-gutter:\s*stable/);
  assert.match(css, /scroll-fade-reveal-b/);
  assert.match(css, /mask-image:/);
  assert.match(css, /tw-shimmer/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("forwards progress semantics to the primitive", async () => {
  const { Progress } = await vite.ssrLoadModule("/components/ui/progress.tsx");
  const html = renderToStaticMarkup(React.createElement(Progress, { value: 37 }));

  assert.match(html, /aria-valuenow="37"/);
  assert.match(html, /aria-valuetext="37%"/);
  assert.match(html, /data-state="loading"/);
});

test("emits chart themes for the starter's media dark mode", async () => {
  const { ChartStyle } = await vite.ssrLoadModule("/components/ui/chart.tsx");
  const html = renderToStaticMarkup(
    React.createElement(ChartStyle, {
      id: "contract",
      config: {
        latency: { theme: { light: "#ffffff", dark: "#000000" } },
      },
    }),
  );

  assert.match(html, /\[data-chart=contract\]/);
  assert.match(html, /@media \(prefers-color-scheme: dark\)/);
  assert.doesNotMatch(html, /\.dark/);
});

test("renders sidebar skeletons deterministically", async () => {
  const { SidebarMenuSkeleton } = await vite.ssrLoadModule(
    "/components/ui/sidebar.tsx",
  );
  const first = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));
  const second = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));

  assert.equal(first, second);
  assert.match(first, /--skeleton-width:70%/);
});

test("light and dark palettes keep core text and action colors readable", async () => {
  const css = await readFile(path.join(root, "app/globals.css"), "utf8");
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/../g).map((value) => {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  for (const selector of [":root", "html.dark"]) {
    const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
    const colors = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map((match) => [match[1], match[2]]));
    for (const [text, surface] of [
      ["foreground", "background"], ["card-foreground", "card"],
      ["primary-foreground", "primary"], ["secondary-foreground", "secondary"],
      ["muted-foreground", "muted"], ["accent-foreground", "accent"],
    ]) {
      const a = luminance(colors[text]);
      const b = luminance(colors[surface]);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert.ok(ratio >= 4.5, `${selector}: ${text}/${surface} contrast ${ratio.toFixed(2)}`);
    }
  }
});

test("dashboard charts and help reuse the palette and logo colors stay coordinated", async () => {
  const page = await readFile(path.join(root, "app/page.tsx"), "utf8");
  const chat = await readFile(path.join(root, "components/help-chat.module.css"), "utf8");
  const logo = await readFile(path.join(root, "public/logo-mark.svg"), "utf8");
  const favicon = await readFile(path.join(root, "public/favicon.svg"), "utf8");
  assert.match(page, /color: "var\(--primary\)"/);
  assert.match(page, /color: "var\(--chart-supply\)"/);
  assert.match(chat, /background: var\(--primary\)/);
  assert.match(chat, /color: var\(--primary-foreground\)/);
  assert.equal(logo, favicon);
  assert.match(logo, /aj-emerald/);
  assert.doesNotMatch(logo, /#E8751A|aj-orange/i);
});
