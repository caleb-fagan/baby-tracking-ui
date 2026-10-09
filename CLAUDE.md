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
npm run lint      # ESLint over the whole project
npm run lint:fix  # ESLint with --fix
npm run format        # Prettier --write .
npm run format:check  # Prettier --check . (no changes)
```

Requires Node 20.19+ (ESLint 10). There is no test runner. Before finishing a change, run `npm run format`, `npm run lint` and `npm run build`; all should pass cleanly with no errors or warnings. The build type-checks every `.vue` file via `vue-tsc`, and lint catches things the type-checker doesn't (e.g. template parse errors such as a missing space between attributes).

### Linting

ESLint 10 flat config in `eslint.config.js`: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-vue` `flat/recommended`, with browser globals for app code and node globals for `*.config.*` files. `dist/` and `node_modules/` are ignored.

`eslint-config-prettier` is the last entry in the config; it turns off every ESLint (and `vue/*`) rule that conflicts with Prettier, so formatting is Prettier's job and lint is for correctness only. Fix lint findings in the code rather than disabling rules or adding `eslint-disable` comments.

### Formatting

Prettier (pinned to an exact version) formats everything except `dist/`, `node_modules/` and `package-lock.json` (see `.prettierignore`). `.prettierrc.json` is the config `create-vue` generates for Vue projects: no semicolons, single quotes, `printWidth` 100; everything else is Prettier's default (2-space indent, trailing commas, double quotes in templates). Run `npm run format` rather than hand-formatting, and don't change the Prettier options without reformatting the whole project in the same change.

## Architecture

```
src/
  main.ts            mounts App, imports style.css
  App.vue            header + tab nav; renders the active tab's component via <component :is>
  store.ts           global reactive `state`, persisted to localStorage (key `baby-tracker-v1`)
  types.ts           all data models (AppState and entry interfaces)
  utils.ts           date/time formatting and list helpers
  style.css          the single global stylesheet (no scoped styles, no CSS framework)
eslint.config.js     ESLint flat config (see Linting)
.prettierrc.json     Prettier options (see Formatting)
  components/
    DashboardView.vue  "Today": stats, quick-add navigation, recent activity, baby profile, delete-all
    MilkFeedings.vue   milk log (breast / pumped / formula) + breast timer
    SolidFeedings.vue  solids log with reaction
    SleepLog.vue       sleep log (nap / night)
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

- Every log entry has a `uid()` string `id`, kept stable across edits. Use `removeById(list, id)` to delete.
- Stored timestamps are **UTC ISO strings** (`new Date().toISOString()`, e.g. `"2026-10-09T18:30:00.000Z"`). The fixed width means sorting is still plain string comparison (`newestFirst`, `localeCompare`). Calendar dates with no time of day (`GrowthEntry.date`, `BabyProfile.birthDate`) stay as local `"YYYY-MM-DD"`. Stopwatch fields are epoch ms. Don't store `Date` objects.
- **Convert at the form boundary.** `<input type="datetime-local">` works in local `"YYYY-MM-DDTHH:mm"`, so forms hold local strings: `utcToLocal()` when loading an entry into the form, `localToUtc()` when saving it (and `nowUtc()` when stamping the current time directly). Display code just passes the stored UTC string to `formatDateTime()`, which renders in the viewer's local zone. Comparing two values from the same form (`form.end < form.start`) is fine because both are local.
- Older saved data used local `"YYYY-MM-DDTHH:mm"` strings; `migrateTimestampsToUtc()` in `store.ts` converts them on load (idempotent). Keep it working if you add timestamp fields.
- Use the helpers in `utils.ts` (`nowLocal`, `nowUtc`, `localToUtc`, `utcToLocal`, `todayLocal`, `toLocalString`, `formatDateTime`, `formatDuration`, `minutesBetween`, `timeAgo`, `babyAge`, `isToday`) rather than reimplementing them.
- Optional numeric fields are `undefined` (not `0` or `''`) when unset; form refs use `number | ''` and are converted on submit (see `opt()` in `GrowthLog.vue`).
- A sleep entry with an empty `end` means the baby is still asleep; the dashboard relies on this.

### Timers

`TimerCard.vue` controls a `Stopwatch` stored in state (`timerKey` prop; currently only `breastTimer`, used by `MilkFeedings.vue`; the sleep timer was removed), so it survives reloads. Elapsed = `elapsedMs + (now - runningSince)` while running. It emits `pause(startedAt, elapsedMs)`; the parent fills its form from that, and clears the timer (`state.xTimer = null`) when the entry is saved. Reuse this pattern for any new timed activity.

## Component conventions

Follow the existing log components (`DiaperLog.vue` is the simplest template, including the edit flow):

- `<script setup lang="ts">` with Composition API; one `reactive` `form` object, an `editingId` ref (`string | null`), plus an `error` ref where the form validates.
- Template is a `<div>` containing a `<form class="card">` and a `<section class="card">` "History" list.
- The same form handles add and edit. `submit()` builds the values, then either `Object.assign`s them onto the entry matching `editingId` or pushes a new one with `uid()`, then calls `resetForm()` (time back to `nowLocal()`).
- `startEdit(id)` copies the entry into the form, sets `editingId` and scrolls to the top; `cancelEdit()` clears `editingId` and resets the form; `remove(id)` cancels the edit first if that entry is the one being edited, then calls `removeById`. The submit button reads "Save changes" while editing, and a Cancel `button.ghost` appears.
- History uses `<ul class="entry-list">` / `<li class="entry">` (plus `.editing` on the entry being edited) with `.icon`, `.body` (`.title`, `.meta`, `.notes`), `.badge`, and `button.ghost` Edit and Delete buttons. Show `<p class="empty">` when there are no entries.
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
- The breastfeeding `TimerCard` is hidden while editing an entry (`v-if="isBreast && !editingId"` in `MilkFeedings.vue`), so the timer can't overwrite the form mid-edit.
- When removing a field from `AppState`, strip it from saved data in `load()` (as is done for the removed `sleepTimer`) so old localStorage data doesn't carry it forever.
- `DashboardView` computes "today" stats with `isToday()` on the start/time string, and only counts sleep entries that have an `end`.
