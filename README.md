# Marea — Gestionale personale per appartamenti in affitto

App web (Next.js 16 + PostgreSQL) per gestire l'appartamento al mare (affitti brevi Booking/Airbnb) e gli appartamenti in affitto mensile: prenotazioni, pagamenti, spese, documenti, note, promemoria, report e un assistente IA. È configurata come **PWA installabile** sul telefono e usa un **database condiviso** (Postgres), quindi i dati sono identici su tutti i dispositivi collegati con lo stesso account.

## Stack tecnico

- **Next.js 16** (App Router, TypeScript) + Tailwind CSS
- **PostgreSQL** con **Prisma ORM**
- **Auth.js (NextAuth v5)** — login email/password, sessione JWT
- **Vercel Blob** — storage per foto e documenti
- **Anthropic Claude API** — lettura screenshot prenotazioni (OCR) e assistente IA
- **Vercel** — hosting

---

## 1. Sviluppo locale

```bash
npm install
cp .env.example .env.local   # poi compila le variabili (vedi sotto)
npm run db:push              # crea le tabelle sul database
npm run db:seed              # crea il primo utente e le impostazioni di default
npm run dev
```

Apri http://localhost:3000. Per lo sviluppo locale serve un Postgres raggiungibile da `DATABASE_URL` (va benissimo anche un database Neon gratuito, non serve installare Postgres in locale).

---

## 2. Guida alla pubblicazione online (passo passo)

Segui questi passaggi nell'ordine. Sono tutti gratuiti nei piani base.

### Passo 1 — Crea il database su Neon

1. Vai su **https://neon.tech** e crea un account gratuito (puoi accedere con GitHub).
2. Crea un nuovo progetto (es. "marea").
3. Nella dashboard del progetto, apri **Connection Details** e copia:
   - la stringa di connessione "**Pooled connection**" → sarà la tua `DATABASE_URL`
   - la stringa di connessione "**Direct connection**" (senza pooler) → sarà la tua `DIRECT_URL`
   - entrambe assomigliano a `postgresql://utente:password@host/dbname?sslmode=require`

Tienile da parte, ti serviranno al Passo 3.

### Passo 2 — Crea un account Anthropic per le funzioni IA

1. Vai su **https://console.anthropic.com** e crea un account.
2. Nella sezione **API Keys**, crea una nuova chiave e copiala (comincia con `sk-ant-...`).
3. Aggiungi un metodo di pagamento e un piccolo credito: le chiamate IA (lettura screenshot + assistente) hanno un costo molto contenuto per un uso personale.
4. Questa sarà la tua `ANTHROPIC_API_KEY`.

### Passo 3 — Pubblica su Vercel

1. Vai su **https://vercel.com** e crea un account (consigliato: accedi con lo stesso account GitHub del repository `Marea-App`).
2. Clicca **Add New → Project** e seleziona il repository `Marea-App` da GitHub (autorizza Vercel ad accedervi se richiesto).
3. Nella schermata di configurazione del progetto, apri **Environment Variables** e aggiungi:

   | Nome | Valore |
   |---|---|
   | `DATABASE_URL` | la pooled connection di Neon (Passo 1) |
   | `DIRECT_URL` | la direct connection di Neon (Passo 1) |
   | `AUTH_SECRET` | una stringa casuale lunga (genera con `openssl rand -base64 32` dal terminale, oppure con https://generate-secret.vercel.app/32) |
   | `ANTHROPIC_API_KEY` | la chiave del Passo 2 |
   | `SEED_USER_EMAIL` | la tua email di accesso |
   | `SEED_USER_PASSWORD` | la password che vuoi usare per accedere |
   | `SEED_USER_NAME` | il tuo nome (opzionale) |

4. Se il progetto non seleziona automaticamente il branch giusto, imposta il **Production Branch** su `claude/marea-rental-management-app-ug1aos` (oppure, meglio, fai il merge di questo branch su `main` da GitHub prima di collegare Vercel, così Vercel userà `main` come branch di produzione).
5. Clicca **Deploy**. La prima build richiede 1-2 minuti.

### Passo 4 — Crea le tabelle nel database e il tuo utente

Le variabili `DATABASE_URL`/`DIRECT_URL` sono ora note a Vercel ma le tabelle nel database vanno create una volta sola. Il modo più semplice è farlo dal tuo computer:

```bash
# nella cartella del progetto, in locale
DATABASE_URL="<la pooled connection di Neon>" \
DIRECT_URL="<la direct connection di Neon>" \
npx prisma db push

SEED_USER_EMAIL="<la tua email>" \
SEED_USER_PASSWORD="<la tua password>" \
DATABASE_URL="<la pooled connection di Neon>" \
npm run db:seed
```

(In alternativa, se preferisci non usare il terminale: installa la [Vercel CLI](https://vercel.com/docs/cli) con `npm i -g vercel`, esegui `vercel env pull .env.local` nella cartella del progetto per scaricare automaticamente le variabili da Vercel, poi lancia semplicemente `npx prisma db push` e `npm run db:seed`.)

Da questo momento puoi accedere all'app pubblicata con l'email e la password scelte in `SEED_USER_EMAIL`/`SEED_USER_PASSWORD`. Potrai aggiungere altri utenti (es. per un familiare) direttamente dall'app, in **Impostazioni**.

### Passo 5 — Attiva l'upload di foto e documenti (Vercel Blob)

1. Nel progetto su Vercel, vai su **Storage → Create Database → Blob**.
2. Crea un nuovo Blob store (es. "marea-files") e collegalo al progetto: Vercel aggiunge automaticamente la variabile `BLOB_READ_WRITE_TOKEN` al progetto.
3. Rifai il deploy (Vercel → Deployments → ⋯ → Redeploy) perché la nuova variabile sia disponibile.

Senza questo passaggio l'app funziona lo stesso, ma il caricamento di screenshot, foto delle spese e documenti sarà disabilitato.

### Passo 6 — Installa l'app sul telefono (PWA)

- **iPhone (Safari):** apri il link della tua app (es. `https://marea-app.vercel.app`) in Safari → tocca l'icona di condivisione (il quadrato con la freccia) → **Aggiungi alla schermata Home**.
- **Android (Chrome):** apri il link in Chrome → tocca i tre puntini in alto a destra → **Aggiungi a schermata Home** (oppure comparirà un banner automatico "Installa app").

Da quel momento l'icona di Marea sarà sulla home del telefono come una app vera, a schermo intero. Puoi fare lo stesso su computer con Chrome/Edge (icona di installazione nella barra degli indirizzi).

### Passo 7 (opzionale) — Collega un dominio personalizzato

1. Nel progetto Vercel, vai su **Settings → Domains** e digita il tuo dominio (es. `marea.tuonome.it`).
2. Se non hai già un dominio, puoi acquistarne uno da un registrar qualsiasi (es. Namecheap, Cloudflare, Aruba) — pochi euro l'anno.
3. Vercel ti mostrerà i record DNS da impostare (di solito un record `A` o `CNAME`): vai sul pannello del tuo registrar/provider DNS e aggiungili.
4. Attendi la propagazione DNS (di solito pochi minuti, a volte fino a qualche ora): Vercel emette automaticamente il certificato HTTPS.

Da quel momento la tua app sarà raggiungibile anche dal dominio personalizzato, oltre che dall'indirizzo `*.vercel.app`.

---

## 3. Uso quotidiano

- **Aggiornamenti**: ogni volta che il codice viene modificato e pubblicato su GitHub, Vercel ricompila e pubblica automaticamente la nuova versione (di solito in 1-2 minuti).
- **Backup**: Neon mantiene automaticamente backup e history del database; per un'esportazione manuale puoi usare `pg_dump` con la connection string del database.
- **Nuovi utenti**: da **Impostazioni → Utenti con accesso** puoi aggiungere altri account (es. un familiare) che vedranno esattamente gli stessi dati.
- **Commissioni/tasse Booking e Airbnb**: modificabili in **Impostazioni**, senza bisogno di intervenire sul codice.

## 4. Struttura del progetto

```
prisma/schema.prisma       Modello dati (appartamenti, prenotazioni, spese, ecc.)
src/app/(app)/              Pagine dell'applicazione (protette da login)
src/app/login/               Pagina di accesso
src/lib/actions/             Server actions (creazione/modifica/eliminazione dati)
src/lib/ai/                  Integrazione Claude (OCR screenshot + assistente)
src/lib/queries.ts           Query e calcoli aggregati (bilanci, dashboard, report)
src/components/              Componenti UI riutilizzabili
public/manifest.webmanifest  Manifest PWA
public/sw.js                 Service worker (funzionamento offline minimo)
```
