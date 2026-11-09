# AJ Climate Controls

A data-driven HVAC operations dashboard built with Vinext, React, TypeScript, Cloudflare D1, and Drizzle.

## Features

- Persistent equipment, work order, alarm, and trend data
- Live operations KPIs and HVAC performance chart
- Create and update maintenance work orders
- Schedule service visits in a persistent monthly calendar and update appointment status
- Update equipment operating status
- Acknowledge active alarms
- Professional orange and charcoal interface
- Fixed desktop navigation bar with a slide-out mobile menu
- Persistent light and dark display modes with system preference detection
- Full responsive company footer with contact, service area, hours, and quick links
- Original scalable AJ Climate Controls logo, compact mark, and matching favicon
- Responsive desktop, tablet, and mobile layouts
- English Chat for Help on every page, with tool suggestions, dashboard guidance, and email support

## Chat for Help

The floating **Chat for Help** button opens a keyboard-accessible guided helper.
It offers prewritten English answers, links to existing HVAC tools and dashboard
sections, and a support email link to `hs22hs@yahoo.com`. It is **not AI, live
support, equipment diagnostics, or an emergency service**. It does not operate
equipment, create work orders, schedule bookings, or send email on the visitor's
behalf. The email link opens the visitor's own mail application.

The helper requires no API key, backend endpoint, or new dependency. Chat text
stays in React page memory (the latest 20 exchanges), survives closing/reopening
the panel, and is removed by **Clear chat** or a full page refresh. It is not
saved in browser storage or sent to a server by this feature. The input is capped
at 300 characters and rendered as escaped text. Messages should not contain
passwords or sensitive site information.

Replies and matching live in `lib/help-chat.ts`; contact details are shared with
the footer through `lib/support.ts`. The dialog uses the existing accessible
dialog component, with focus management, Escape to close, mobile layout, dark
mode, and reduced-motion support.

## Run locally

```bash
npm install
npm run dev
```

Open the local address shown in the terminal.

## Production build

```bash
npm run build
```

## Validation

```bash
npm run typecheck
npm test
```

`typecheck` builds the Worker, generates Cloudflare runtime and D1 binding types
from `dist/server/wrangler.json`, and runs TypeScript with no emitted files.
Generated definitions stay in the ignored `.wrangler/` directory. Run this command
after a fresh checkout or changes to Worker bindings; standalone `tsc` needs those
definitions first. `npm test` builds the app and runs the calculator, diagnostic,
rendering, and production Worker checks.

## Database

The dashboard uses the logical D1 binding `DB`. The database schema, including service appointments, is defined in `db/schema.ts`, and generated migrations are stored in `drizzle/`.

The API automatically inserts a small demonstration dataset the first time the dashboard loads. All later changes are stored persistently.

## Main files

- `app/page.tsx` — interactive operations dashboard
- `app/api/dashboard/route.ts` — persistent dashboard API
- `app/globals.css` — complete visual design and responsive styles
- `app/layout.tsx` — metadata and global layout
- `db/schema.ts` — equipment, work order, alarm, and trend schema
- `drizzle/` — database migrations
- `public/favicon.svg` — custom AJ brand icon
- `public/logo.svg` — full horizontal vector logo
- `public/logo-mark.svg` — compact vector brand mark

## HVAC tools

Open `/tools` from the dashboard navigation for temperature split (cooling/heating),
superheat, subcooling, round/rectangular duct airflow, and thermal capacity conversions.
The calculators accept manual readings and work independently of the dashboard database.
Temperature and airflow unit changes convert the current readings. Each calculator has
an explicitly loaded example and a clear action; no readings are saved.

Superheat uses refrigerant dew temperature and subcooling uses bubble temperature,
entered from the appropriate pressure–temperature chart. Results retain their sign and
do not prescribe charging targets. Formula references are linked beside each calculator.

The **0–10 VDC Output Troubleshooting Tool** at `/tools/voltage-troubleshooter`
classifies a manual DC reading as low (0 to <2 V), mid-range (2 to <8 V), high
(8 to <10 V), full command (10 V), or out of range (<0 or >10 V). Every reading
above 10 V shows an explicit warning. Valid signals include a percentage of the
0–10 V span and context-specific controller, wiring, actuator and VFD checks.
These are display bands with no tolerance applied, assuming direct-acting 0–10 V;
verify equipment specifications for 2–10 V or reverse action. Voltage alone does
not establish actual position, speed or a failed component. Examples and clear
controls work in both display modes, and readings are not saved.

## Technology

- React
- TypeScript
- Vinext / Vite
- Lucide icons
- Cloudflare D1
- Drizzle ORM
- Recharts
- Cloudflare-compatible output
