# AJ Climate Controls

A data-driven HVAC operations dashboard built with Vinext, React, TypeScript, Cloudflare D1, and Drizzle.

## Features

- Persistent equipment, work order, alarm, and trend data
- Live operations KPIs and HVAC performance chart
- Create and update maintenance work orders
- Update equipment operating status
- Acknowledge active alarms
- Professional orange and charcoal interface
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

The dashboard uses the logical D1 binding `DB`. The database schema is defined in `db/schema.ts`, and generated migrations are stored in `drizzle/`.

The API automatically inserts a small demonstration dataset the first time the dashboard loads. All later changes are stored persistently.

## Main files

- `app/page.tsx` — interactive operations dashboard
- `app/api/dashboard/route.ts` — persistent dashboard API
- `app/globals.css` — complete visual design and responsive styles
- `app/layout.tsx` — metadata and global layout
- `db/schema.ts` — equipment, work order, alarm, and trend schema
- `drizzle/` — database migrations
- `public/favicon.svg` — custom AJ brand icon

## Technology

- React
- TypeScript
- Vinext / Vite
- Lucide icons
- Cloudflare D1
- Drizzle ORM
- Recharts
- Cloudflare-compatible output
