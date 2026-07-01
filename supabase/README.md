# Supabase Setup — artGRANIT

## 1. Creați proiect pe [supabase.com](https://supabase.com)

## 2. Alegeți schema

| Fișier | Utilizare |
|--------|-----------|
| `schema.sql` | **MVP / demo** — policy anon deschis |
| `schema-production.sql` | **Producție** — RLS + profiles + auth.uid() |

## 3. Storage

- Bucket **`field-photos`**
- Policy: utilizator autentificat upload/read propriile fișiere

## 4. Auth (opțional)

1. Creați utilizatori în Supabase Auth (email @artgranit.ro)
2. Rulați seed profiles din comentariile din `schema-production.sql`
3. În `.env.local`:
   ```
   VITE_USE_SUPABASE_AUTH=true
   ```

## 5. Configurați aplicația

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_BITRIX_WEBHOOK_URL=https://artgranit.bitrix24.ro/rest/1/xxx/
```

## Comportament

| Mod | Descriere |
|-----|-----------|
| Fără .env | LocalStorage + IndexedDB |
| Cu Supabase | Sync progres la login + save |
| Cu Auth | Login email + parolă Supabase |
