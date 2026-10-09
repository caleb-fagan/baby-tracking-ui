# CLAUDE.md

Guidance for working on the Baby Tracker UI.

## What this is

A client-only Vue 3 + Vite + TypeScript single-page app for tracking a baby's milk feedings, solids, sleep, diapers and growth. There is no backend: all data lives in the browser's `localStorage`. Units are metric (ml, kg, cm).

## Commands

```bash
npm install
npm run dev       # Vite dev server (usually http://localhost:5173)
npm run build     # vue-tsc -b (type-check) && vite build -> dist/
npm run preview   # serve the production build
```

There is no test runner or linter configured. `npm run build` is the verification step: it type-checks every `.vue` file via `vue-tsc`, so run it after changes.

## Architecture

```
src/
  main.ts            mounts App, imports style.css
  App.vue            header + tab nav; renders the active tab's component via <component :is>
  store.ts           global reactive `state`, persisted to localStorage (key `baby-tracker-v1`)
  types.ts           all data models (AppState and entry interfaces)
  utils.ts           date/time formatting and list helpers
  style.css          the single global stylesheet (no scoped styles, no CSS framework)
  components/
    DashboardView.vue  "Today": stats, quick-add navigation, recent activity, baby profile, delete-all
    MilkFeedings.vue   milk log (breast / pumped / formula) + breast timer
    SolidFeedings.vue  solids log with reaction
    SleepLog.vue       sleep log (nap / night) + sleep timer
    DiaperLog.vue      diaper log (wet / dirty / both)
    GrowthLog.vue      weight / height / head circumference
    TimerCard.vue      reusable pausable stopwatch bound to a store timer
```

### Navigation

No router. `App.vue` holds a `tabs` array (`id`, `label`, `icon`, `component`) and an `activeId` ref. Child views can emit `navigate` with a tab id (the dashboard's quick-add buttons do this). To add a tab: create the component, add it to `tabs`, and add a `.theme-<id>` rule in `style.css`.

### State and persistence

- `state` in `src/store.ts` is a single `reactive<AppState>`. Components import it directly and mutate it (`state.diapers.push(...)`); there are no stores, actions or props for data.
- A deep `watch` writes the whole state to `localStorage` on every change. Storage errors are swallowed on purpose so the app keeps working in memory.
- `load()` merges saved data over `defaults()`, with `baby` merged separately so profiles saved before new fields existed still get defaults. When you add a field to `AppState` or `BabyProfile`, add a default in `defaults()` and keep that merge working for old saved data. If a change would break old data, migrate in `load()` rather than bumping `STORAGE_KEY`, which would orphan users' existing data.
- `clearAllData()` resets to defaults (used by the dashboard's "Delete all data").

### Data conventions

- Every log entry has a `uid()` string `id`. Use `removeById(list, id)` to delete.
- Timestamps are **local-time strings**, not ISO/UTC: `"YYYY-MM-DDTHH:mm"` (the `datetime-local` input format). Dates are `"YYYY-MM-DD"`. Because of this format, sorting and comparison are plain string comparison (`newestFirst`, `localeCompare`, `form.end < form.start`). Don't introduce `Date` objects or UTC strings into stored data.
- Use the helpers in `utils.ts` (`nowLocal`, `todayLocal`, `toLocalString`, `formatDateTime`, `formatDuration`, `minutesBetween`, `timeAgo`, `babyAge`, `isToday`) rather than reimplementing them.
- Optional numeric fields are `undefined` (not `0` or `''`) when unset; form refs use `number | ''` and are converted on submit (see `opt()` in `GrowthLog.vue`).
- A sleep entry with an empty `end` means the baby is still asleep; the dashboard relies on this.

### Timers

`TimerCard.vue` controls a `Stopwatch` stored in state (`breastTimer` or `sleepTimer`), so it survives reloads. Elapsed = `elapsedMs + (now - runningSince)` while running. It emits `pause(startedAt, elapsedMs)`; the parent fills its form from that, and clears the timer (`state.xTimer = null`) when the entry is saved. Reuse this pattern for any new timed activity.

## Component conventions

Follow the existing log components (`DiaperLog.vue` is the simplest template):

- `<script setup lang="ts">` with Composition API; one `reactive` `form` object plus an `error` ref for validation messages.
- Template is a `<div>` containing a `<form class="card" @submit.prevent="add">` and a `<section class="card">` "History" list.
- `add()` validates, pushes to `state`, then resets the form (time back to `nowLocal()`).
- History uses `<ul class="entry-list">` / `<li class="entry">` with `.icon`, `.body` (`.title`, `.meta`, `.notes`), `.badge`, and a `button.ghost` Delete. Show `<p class="empty">` when there are no entries.
- Display labels for enum values live in a `Record<Kind, string>` map in the component (e.g. `kindLabels`) and are reused for both `<select>` options and the history list.
- Emoji are used as icons throughout (tabs, headings, entries); keep that style instead of adding an icon library.

## Styling

- All styling is in `src/style.css`. Use the existing classes (`card`, `form-grid` + `wide`, `form-actions`, `entry-list`/`entry`, `badge`, `empty`, `error`, `stat-grid`/`stat`) and buttons `primary`, `ghost`, `danger` before writing new CSS.
- Soft pastel theme driven by CSS variables on `:root` (`--pink`, `--blue`, `--mint`, `--lavender`, `--yellow`, `--peach` and their `-d` darker variants for text/accents).
- Per-section colour comes from `.theme-<tabId>` classes, which set `--accent` / `--accent-soft`. `<main>` gets the active theme class, and tab buttons get their own. Components should colour with `var(--accent)` / `var(--accent-soft)` so they pick up their section's colour automatically. Don't hardcode section colours inside components.
- Layout is a centered column, `max-width: 760px`, mobile-first with a `max-width: 480px` tweak. Check changes at phone width; the tab bar scrolls horizontally.
- Labels wrap inputs (`<label>Text <input/></label>`) with no `for`/`id` pairing; keep that structure so the global `label` styles apply.

## Things to watch

- `README.md` says "nothing leaves your device"; keep it true. Don't add network calls, analytics or external fonts without discussing it.
- Destructive actions are confirmed only for "Delete all data" (`window.confirm`); per-entry Delete buttons delete immediately.
- `DashboardView` computes "today" stats with `isToday()` on the start/time string, and only counts sleep entries that have an `end`.
