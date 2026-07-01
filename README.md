# artGRANIT — Plan Instruire PWA

Platformă digitală PWA pentru **Planul de Instruire și Adaptare Profesională artGRANIT** (Rol: Inginer Proiectant).

## Tehnologii

- **React 18** + **Vite 5** + **TypeScript**
- **Tailwind CSS**
- **vite-plugin-pwa** — offline, instalabil
- **LocalStorage** + **IndexedDB** (poze șantier)
- **Supabase** (opțional) — sincronizare cloud

## Pornire rapidă

```bash
npm install
npm run setup    # iconițe PWA + documente HTML suport
npm run dev      # http://localhost:5173
```

```bash
npm run build
npm run preview
npm run test
```

## Conturi demo artGRANIT

| Rol | Email | Acces |
|-----|-------|-------|
| Stagiar 1 | a.popescu@artgranit.ro | Dashboard, zile, test Z10 |
| Stagiar 2 | a.dumitrescu@artgranit.ro | idem |
| Stagiar 3 | c.marin@artgranit.ro | idem |
| Mentor | m.ionescu@artgranit.ro | Validări, feedback, selector stagiar |
| Admin HR | e.vasilescu@artgranit.ro | Rapoarte HR, export CSV/PDF, setări |

Parola demo: orice text (mod local) · cu Supabase Auth: parola setată în Supabase.

## Deploy

Vezi [DEPLOY.md](DEPLOY.md) — Vercel, Netlify, GitHub Pages.

## Funcționalități

- **Plan 20 zile** — 4 săptămâni, deblocare secvențială, validări mentor (zile 5, 10, 13, 19, 20)
- **Test teoretic** — Ziua 10 (80% promovare, max 3 încercări)
- **Mod șantier** — UI mărit, upload poze (IndexedDB)
- **Bitrix24** — link-uri rapide zile 5, 7, 11 (`https://artgranit.bitrix24.ro`)
- **Acte constatare**, **matrice competențe**, **bibliotecă erori**
- **Certificat digital** — Ziua 20
- **Panou Admin/HR** — dashboard cohortă, status risc, export CSV/Excel/PDF, audit, backup JSON
- **Supabase opțional** — vezi [supabase/README.md](supabase/README.md)

## Configurare opțională

Copiați `.env.example` → `.env.local`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_BITRIX_PORTAL_URL=https://artgranit.bitrix24.ro
```

## Structură proiect (principal)

```
src/
├── data/           # Plan instruire, utilizatori, competențe, Bitrix
├── lib/            # progressLogic, hrReport, exportReport, sync, supabase
├── store/          # LocalStorage + photoStore (IndexedDB)
├── context/        # Auth, Progress, Stagiar, FieldMode
├── components/     # dashboard, day, mentor, admin, field, certificate
└── pages/          # Login, Dashboard, Day, Mentor, Admin, Evaluări, etc.
```

## PWA — Instalare

După `npm run build`:
- **Chrome/Edge:** iconița „Instalare" din bara de adrese
- **iOS Safari:** Share → Add to Home Screen
- **Android Chrome:** Meniu → Instalează aplicația

## Funcționalități avansate

- **Auth Supabase** (opțional) — `VITE_USE_SUPABASE_AUTH=true`
- **Certificat PDF branduit** — jsPDF, nr. unic artGRANIT
- **Bitrix API** — webhook pentru deal-uri din acte (`VITE_BITRIX_WEBHOOK_URL`)
- **Panou mentor cohortă** — vedere toți stagiarii
- **Alerte HR** — banner + notificări browser
- **Bibliotecă erori** — heatmap din acte reale
- **Multi-cohort** — Cohortă I/II 2026, setări Admin
- **Deploy** — `vercel.json` inclus
- **ESLint + CI** — lint, test, build

## Panou Admin HR (funcții enterprise)

| Funcție | Descriere |
|---------|-----------|
| **Status cohortă** | Finalizat, La zi, Risc, Întârziat, Neînceput — bazat pe planul 20 zile / 4 săptămâni artGRANIT |
| **Grafic progres** | Completare per săptămână, media cohortă |
| **Coadă mentor** | Validări în așteptare (zile 5, 10, 13, 19, 20) |
| **Tabel stagiari** | Căutare, filtru status, sortare |
| **Export** | CSV, Excel (.xlsx), PDF/Print |
| **Jurnal audit** | Activitate agregată + export CSV |
| **Backup JSON** | Export/import progres + setări (migrare browser) |

## CI

GitHub Actions rulează `npm run test` și `npm run build` la push/PR pe `main`.
