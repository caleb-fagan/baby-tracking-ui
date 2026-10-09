# Baby Tracker

A Vue 3 + Vite + TypeScript app for tracking a baby's milk feedings, solid feedings, sleep, diapers and growth.
All data is stored in the browser's `localStorage` (nothing leaves your device). Units are metric (ml, kg, cm).

## Getting started

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – type-check and build for production into `dist/`
- `npm run preview` – preview the production build

## Structure

- `src/store.ts` – reactive app state, persisted to `localStorage`
- `src/types.ts` – data models
- `src/utils.ts` – date/time helpers
- `src/components/` – one view per tracker (Today dashboard, Milk, Solids, Sleep, Diapers, Growth)
- `src/style.css` – soft pastel theme
