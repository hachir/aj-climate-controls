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
