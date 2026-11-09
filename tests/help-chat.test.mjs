import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root,
  resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { getHelpReply, helpTopics, helpWelcome, HELP_MESSAGE_LIMIT } = await vite.ssrLoadModule("/lib/help-chat.ts");
const { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } = await vite.ssrLoadModule("/lib/support.ts");
const { toolDirectory } = await vite.ssrLoadModule("/lib/tool-directory.ts");

test("quick topics have useful answers and empty messages return the welcome", () => {
  assert.deepEqual(getHelpReply(" \n "), helpWelcome);
  for (const topic of helpTopics) {
    const reply = getHelpReply(topic);
    assert.ok(reply.links.length > 0, topic);
    assert.doesNotMatch(reply.text, /don't have a prepared answer/);
  }
});

test("natural-language questions rank the intended tool first", () => {
  for (const [query, href] of [
    ["How do I check boiler flow?", "/tools/boiler-flow-checkout"],
    ["My BACnet MS/TP device is offline", "/tools/bacnet-mstp"],
    ["I need help with my fan coil", "/tools/hydronic-terminal-checkout"],
    ["VFD not working", "/tools/vfd-checkout"],
    ["Check a 0–10 VDC output", "/tools/voltage-troubleshooter"],
    ["Convert 4-20 mA", "/tools/signal-converter"],
    ["Fire alarm shutdown checkout", "/tools/fire-alarm-shutdown"],
    ["Check the fire alarm dry contact", "/tools/fire-alarm-shutdown"],
    ["CFM calculation please", "/tools#field-calculators"],
  ]) {
    assert.equal(getHelpReply(query).links[0].href, href, query);
  }
});

test("calculator links work from any page and all tool destinations exist", async () => {
  for (const tool of toolDirectory) {
    const href = tool.href.startsWith("#") ? `/tools${tool.href}` : tool.href;
    await access(`${root}/app${href.split("#")[0]}/page.tsx`);
  }
  const reply = getHelpReply("superheat");
  assert.ok(reply.links.some((link) => link.href === "/tools#field-calculators"));
  assert.ok(reply.links.every((link) => !link.href.startsWith("#")));
});

test("dashboard guidance points to real sections without claiming to change records", async () => {
  const dashboard = await readFile(`${root}/app/page.tsx`, "utf8");
  for (const query of ["work order", "schedule visit", "find equipment", "acknowledge alarm"]) {
    const reply = getHelpReply(query);
    assert.ok(dashboard.includes(`id="${reply.links[0].href.split("#")[1]}"`));
  }
  assert.match(getHelpReply("work order").text, /does not create or change/);
  assert.match(getHelpReply("Where are my saved work orders?").text, /Work orders table/);
  assert.match(getHelpReply("schedule visit").text, /does not send a booking request/);
  assert.match(getHelpReply("find equipment").text, /does not operate/);
  assert.match(getHelpReply("acknowledge alarm").text, /does not fix/);
});

test("support uses the user's email and never claims a message was sent", () => {
  assert.equal(SUPPORT_EMAIL, "hs22hs@yahoo.com");
  assert.equal(SUPPORT_EMAIL_HREF, "mailto:hs22hs@yahoo.com");
  const reply = getHelpReply("Contact support");
  assert.equal(reply.links[0].href, SUPPORT_EMAIL_HREF);
  assert.match(reply.text, /no message is sent/);
  assert.match(reply.text, /not guaranteed/);
});

test("privacy clearly discloses prewritten replies and temporary page memory", () => {
  for (const query of ["is this AI?", "live agent", "privacy", "are messages saved?"]) {
    const reply = getHelpReply(query);
    assert.match(reply.text, /prewritten replies, not AI or a live agent/);
    assert.match(reply.text, /does not send or save them to a server/);
    assert.match(reply.text, /Clear chat/);
  }
});

test("emergency and safety-bypass requests take priority over tool matching", () => {
  const emergency = getHelpReply("I smell gas by my boiler, contact support");
  assert.match(emergency.text, /not an emergency service/);
  assert.deepEqual(emergency.links, []);
  for (const query of ["bypass boiler safety", "jumper the fire interlock", "override high limit"]) {
    const reply = getHelpReply(query);
    assert.match(reply.text, /cannot help bypass/);
    assert.ok(reply.links.every((link) => link.href.startsWith("mailto:")));
  }
});

test("unknown questions fall back instead of inventing answers or links", () => {
  for (const query of ["purple elephants", "<script>alert('x')</script>", "https://untrusted.invalid"]) {
    const reply = getHelpReply(query);
    assert.match(reply.text, /don't have a prepared answer/);
    assert.deepEqual(reply.links.map((link) => link.href), ["/tools", SUPPORT_EMAIL_HREF]);
  }
  assert.match(getHelpReply("boiler flow").text, /have not diagnosed/);
});

test("input length is bounded without losing safe handling", () => {
  assert.equal(HELP_MESSAGE_LIMIT, 300);
  assert.match(getHelpReply("x".repeat(301)).text, /300 characters or fewer/);
  assert.deepEqual(getHelpReply("x".repeat(301)).links, []);
  assert.match(getHelpReply("x".repeat(300)).text, /don't have a prepared answer/);
});

test("chat launcher is a labelled button with dialog semantics", async () => {
  const { HelpChat } = await vite.ssrLoadModule("/components/help-chat.tsx");
  const html = renderToStaticMarkup(React.createElement(HelpChat));
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, />Chat for Help</);
});

test("chat stays client-side, escapes messages as text, and is mounted globally", async () => {
  const component = await readFile(`${root}/components/help-chat.tsx`, "utf8");
  assert.doesNotMatch(component, /\bfetch\s*\(|localStorage|sessionStorage|dangerouslySetInnerHTML/);
  assert.match(component, /<p>\{message.text\}<\/p>/);
  assert.match(component, /role="log"/);
  assert.match(component, /aria-label="Clear chat"/);
  assert.match(component, /maxLength=\{HELP_MESSAGE_LIMIT\}/);
  const layout = await readFile(`${root}/app/layout.tsx`, "utf8");
  assert.match(layout, /<HelpChat\s*\/>/);
});

test("footer and help share one verified contact address", async () => {
  const dashboard = await readFile(`${root}/app/page.tsx`, "utf8");
  assert.match(dashboard, /href=\{SUPPORT_EMAIL_HREF\}/);
  assert.match(dashboard, /<strong>\{SUPPORT_EMAIL\}<\/strong>/);
  assert.doesNotMatch(dashboard, /service@ajclimatecontrols\.example|ha1991@yahoo\.com/);
});
