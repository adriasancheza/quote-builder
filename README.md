# Quote Builder

Create professional quotes (_presupuestos_) for freelancers and small businesses in Spain, and
download them as PDF. Everything runs in the browser: no sign-up, no backend, and your data never
leaves your device.

**Live demo:** https://adriasancheza.github.io/quote-builder/

![Quote editor with the live A4 preview](docs/screenshot.png)

> The user interface is in Spanish, since it targets the Spanish market (EUR, Spanish VAT rates
> and number/date formats).

## Features

- **Company profile** – name, NIF/CIF, address, contact details and a logo (stored as a data URL).
- **Clients** – create, edit, search and delete clients. Deleting a client keeps its quotes.
- **Quotes list** – filter by status (draft, sent, accepted, rejected), see totals at a glance,
  get a hint when a quote has expired, duplicate or delete (with confirmation).
- **Quote editor**
  - Line items with description, quantity, unit price, discount % and per-line VAT (21, 10, 4 or
    0 %).
  - Live totals with a VAT breakdown table (VAT is computed per rate on the aggregated base).
  - Notes/terms, issue date and validity date.
  - Automatic numbering per year: `2026-0001`, `2026-0002`, … restarting every January.
  - Autosave on every change.
- **Live preview** of the quote document next to the editor (Edit/Preview switch on mobile).
- **Download PDF** using a print stylesheet and `window.print()` → "Save as PDF". Only the A4
  document is printed; the app chrome is hidden.
- **Backup & restore** – export all data (company, clients, quotes) to JSON and import it back.
  Imported files are validated before anything is replaced.
- Example company and quote (fictional data) seeded on first run.
- Light and dark themes (`prefers-color-scheme`), responsive mobile-first layout, keyboard
  accessible dialogs and AA contrast.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict)
- [Vite](https://vite.dev/) for dev server and build
- Plain CSS: design tokens + CSS Modules, no UI component library
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) (jsdom)
- ESLint (flat config, type-aware `typescript-eslint`) + Prettier
- GitHub Actions for CI and GitHub Pages deployment

## Getting started

Requirements: Node.js 22.12 or newer (CI uses Node 24).

```bash
npm install        # install dependencies
npm run dev        # start the dev server at http://localhost:5173/quote-builder/
npm run build      # type-check and build for production into dist/
npm run preview    # serve the production build locally
npm run test       # run unit and component tests once
npm run test:watch # run tests in watch mode
npm run lint       # ESLint + Prettier check
npm run format     # format the codebase with Prettier
```

## Project structure

```text
quote-builder/
├── .github/workflows/   # ci.yml (lint/test/build) and deploy.yml (GitHub Pages)
├── docs/                # README assets
├── public/              # static files (favicon)
└── src/
    ├── lib/             # framework-free domain logic + unit tests
    │   ├── calculations.ts  # line amounts, totals, VAT breakdown
    │   ├── money.ts         # rounding to cents, EUR formatting
    │   ├── numbering.ts     # yearly sequential quote numbers
    │   ├── dates.ts         # ISO dates, Spanish formatting
    │   ├── quotes.ts        # quote factories (create, duplicate)
    │   ├── reducer.ts       # pure state transitions
    │   ├── backup.ts        # JSON export/import + validation
    │   ├── storage.ts       # localStorage persistence
    │   └── seed.ts          # first-run example data
    ├── store/           # tiny external store + React bindings (useSyncExternalStore)
    ├── components/      # UI building blocks (modal, line items, quote document…)
    ├── pages/           # screens: quotes, quote editor, clients, company, data
    ├── hooks/           # hash router hook
    ├── utils/           # browser helpers (file download/reading, printing)
    ├── styles/          # design tokens, shared UI primitives, print stylesheet
    └── test/            # test setup and helpers
```

### Design notes

- **Pure logic first.** Money, VAT and numbering rules live in `src/lib` as plain functions with
  no React dependency, so they are easy to test and reuse. Amounts are rounded to cents with
  "round half away from zero", avoiding floating point artefacts such as `1.005 → 1.00`.
- **Hash routing** (`#/quotes/…`) keeps the app fully static, so it works on GitHub Pages without
  server rewrites.
- **Data safety.** If stored data cannot be read, a copy is kept under a separate key instead of
  being overwritten, and storage quota errors are shown to the user.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes
`dist/` to GitHub Pages. In the repository settings, set **Pages → Source** to **GitHub Actions**.
The Vite `base` is `/quote-builder/` to match the Pages URL.

## License

[MIT](LICENSE) © 2026 Adrià Sánchez
