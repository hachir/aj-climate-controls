# AJ Climate Controls

A polished, responsive commercial HVAC controls and building automation website built with Vinext, React, TypeScript, and CSS.

## Features

- Professional industrial controls visual system
- Responsive desktop, tablet, and mobile layouts
- HVAC operations dashboard in the hero section
- Service, workflow, expertise, and contact sections
- Accessible semantic structure and reduced-motion support
- SEO-ready page title and description

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

## Customize

Update the `company` object near the top of `app/page.tsx` before publishing:

```ts
const company = {
  phone: "(801) 555-0148",
  phoneHref: "+18015550148",
  email: "service@ajclimatecontrols.com",
  serviceArea: "Salt Lake City & the Wasatch Front",
};
```

The current phone number and email are demonstration placeholders.

## Main files

- `app/page.tsx` — website content and structure
- `app/globals.css` — complete visual design and responsive styles
- `app/layout.tsx` — metadata and global layout
- `public/favicon.svg` — custom AJ brand icon

## Technology

- React
- TypeScript
- Vinext / Vite
- Lucide icons
- Cloudflare-compatible output
