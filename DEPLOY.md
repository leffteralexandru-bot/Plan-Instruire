# Deploy artGRANIT PWA

## Varianta 1 — Vercel (recomandat)

1. Push cod pe GitHub
2. [vercel.com](https://vercel.com) → Import project
3. Framework: **Vite**, Build: `npm run build`, Output: `dist`
4. Variabile env (Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BITRIX_PORTAL_URL`
   - `VITE_BITRIX_WEBHOOK_URL` (opțional)
5. Deploy → URL public HTTPS (PWA instalabil)

Fișier `vercel.json` este deja configurat.

## Varianta 2 — Netlify

```bash
npm run build
```

Drag & drop folder `dist/` pe [app.netlify.com/drop](https://app.netlify.com/drop)

Sau `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Varianta 3 — GitHub Pages

Workflow `.github/workflows/deploy.yml` publică automat `dist/` la push pe `main`.

Setări repo: **Settings → Pages → Source: GitHub Actions**

## Varianta 4 — Server intern artGRANIT

```bash
npm run build
npm run preview   # test local
```

Serviți `dist/` cu nginx/IIS + HTTPS obligatoriu pentru PWA.

## Checklist post-deploy

- [ ] Login funcționează (cont demo)
- [ ] PWA instalabilă din browser
- [ ] Supabase sync (dacă e configurat)
- [ ] Iconițe: `npm run icons` înainte de build
- [ ] Documente: `npm run docs` înainte de build
