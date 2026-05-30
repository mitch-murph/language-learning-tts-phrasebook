# Language Learning TTS Phrasebook

A personal web app for language learning. Type a phrase, hear it spoken at a slow "language teacher" pace, and save it to a searchable library with optional romanisation and English translation. Mobile and desktop friendly, with two visual themes and four playback modes.

**Live:** `https://mitcmurph.github.io/language-learning-tts-phrasebook`

---

## Features

- **Playback modes:** Triple (slow → slow → normal), Slow, Normal, Drill (looped slow).
- **Themes:** comic (paper / Bangers / hard shadows) or ink (editorial / Newsreader serif). Toggle in the topbar.
- **Library:** phrases grouped by language. Inline play, edit (transcription / translation), and delete with confirmation.
- **Cheap by design:** Lambda is invoked only when saving, listing, editing, or deleting. Replay reads MP3 directly from S3 — no Lambda hit.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + MUI (Material UI) → GitHub Pages |
| Backend | AWS Lambda (Node.js 20 + TypeScript) via Lambda Function URL |
| Database | DynamoDB (provisioned 1 WCU / 1 RCU — always-free tier) |
| Audio storage | S3 public bucket (content-addressed by SHA-256) |
| IaC | AWS SAM |
| CI/CD | GitHub Actions |
| TTS | Google TTS v1beta1 via `cxl-services.appspot.com` proxy (`Charon` / Gemini model) — **called directly from the browser** |
| API spec | `openapi.yaml` (OpenAPI 3.1) |

**Cost:** ~$0.01/month. Everything within AWS free tiers.

---

## Architecture

```
              ┌─────────────────────┐
              │  GitHub repository  │
              │      (main)         │
              └──────────┬──────────┘
                         │ git push
              ┌──────────┴──────────┐
              ▼                     ▼
     ┌────────────────┐    ┌────────────────┐
     │ deploy-frontend│    │ deploy-backend │
     │  vite build    │    │  sam deploy    │
     │  → gh-pages    │    │  uses AWS creds│
     └───────┬────────┘    └───────┬────────┘
             │ publish             │ assumes IAM deploy user
             ▼                     ▼
     ┌──────────────┐      ┌──────────────────┐
     │ GitHub Pages │      │ IAM deploy user  │
     │ static HTTPS │      │ Lambda / IAM /   │
     └──────┬───────┘      │ S3 / DynamoDB /  │
            │              │ CloudFormation   │
            │ user loads   └─────────┬────────┘
            ▼                        │ CloudFormation
     ┌──────────────────────────┐    │ provisions resources
     │  Browser (React + MUI)   │    ▼
     │                          │
     │ • HMAC-TOTP token gen    │── POST audio ──► ┌──────────────┐
     │ • calls Google TTS       │                  │  Google TTS  │
     │   directly (proxy URL    │◄── base64 MP3 ──│  proxy       │
     │   in localStorage)       │                  │ cxl-services │
     │ • plays + caches audio   │                  └──────────────┘
     │ • saves prefs in LS      │
     └──┬──────────────┬────────┘
        │              │ replay (direct GET .mp3, no Lambda)
        │ POST /phrases│
        │ + audioBase64│
        │ GET /phrases │
        │ PUT /phrases │
        │ DEL /phrases │
        ▼              ▼
     ┌──────────────┐ ┌─────────────────────────┐
     │   Lambda     │ │  S3 audio bucket        │
     │ Function URL │ │  public-read + CORS     │
     │ Node 20      │ │  audio/<lang>/<sha>.mp3 │
     │ Concurrency=2│ └─────────────────────────┘
     └──┬────┬──────┘            ▲
        │    │ upload audio      │
        │    └───────────────────┘
        │ write/read records
        ▼
     ┌──────────────────────┐
     │  DynamoDB            │
     │  tts-phrases         │
     │  PK: userId="default"│
     │  SK: phraseId (uuid) │
     └──────────────────────┘
```

The browser calls the Google TTS proxy directly using a short-lived OAuth2 token from the Settings modal. Lambda never sees the token and never makes a TTS call — it just persists the audio bytes the browser hands it. For replay, the frontend constructs the S3 URL from the stored `s3Key` and plays it without invoking Lambda at all.

---

## First-Time Setup

### Prerequisites

- AWS account + AWS CLI configured
- AWS SAM CLI installed
- Node.js 20+
- GitHub repository with Actions enabled

### 1. Create a deploy IAM user

In the AWS console, create an IAM user (`language-learning-tts-phrasebook-deploy`) and attach these managed policies:

- `AWSLambda_FullAccess`
- `AmazonDynamoDBFullAccess`
- `AmazonS3FullAccess`
- `AWSCloudFormationFullAccess`
- `IAMFullAccess` ← required for SAM to create the Lambda execution role

Generate an access key and note the key ID and secret.

### 2. Build and deploy the backend

```bash
cd backend
npm install
npm run build

cd ..
sam deploy --guided
```

Follow the prompts. When asked for `HmacSecret`, enter any random string (e.g. `openssl rand -hex 32`). After deploy completes, note the outputs:

- `LambdaFunctionUrl` — the Lambda endpoint
- `AudioBaseUrl` — the S3 base URL for audio playback

### 3. Add GitHub Secrets

In your repo → Settings → Secrets → Actions, add:

| Secret | Value |
|---|---|
| `HMAC_SECRET` | The same secret you used in `sam deploy --guided` |
| `AWS_ACCESS_KEY_ID` | Deploy IAM user access key ID |
| `AWS_SECRET_ACCESS_KEY` | Deploy IAM user secret key |
| `AWS_REGION` | Your AWS region (e.g. `ap-southeast-2`) |
| `LAMBDA_URL` | `LambdaFunctionUrl` from SAM deploy output |
| `AUDIO_BASE_URL` | `AudioBaseUrl` from SAM deploy output |

### 4. Enable GitHub Pages

Repo → Settings → Pages → Source: **Deploy from a branch** → branch: `gh-pages`.

### 5. Push to deploy

```bash
git push origin main
```

Both GitHub Actions workflows will run — backend deploys via SAM, frontend builds and publishes to GitHub Pages.

---

## Using the App

1. Open `https://<your-username>.github.io/language-learning-tts-phrasebook`.
2. Click the **⚙ Settings** icon and paste your TTS proxy URL (including `?token=...`) and the Audio Base URL from SAM outputs. They're saved to `localStorage`.
3. Pick a language pill, type a phrase, choose a mode (Triple / Slow / Normal / Drill), and hit **Hear it** to preview or **Save** to add it to your library.
4. Saved phrases appear below, grouped by language. Each row has Play (S3 replay, no Lambda), Edit (transcription / translation), and Delete (with confirmation).
5. Use the **Ink / Comic** button in the topbar to swap themes.

The TTS OAuth2 token is short-lived — when audio stops working, open Settings and paste a fresh URL.

---

## Development

```bash
# Backend
cd backend
npm install
npm run build          # esbuild bundle → dist/handler.js
npm run build:watch    # watch mode

# Test locally with SAM
sam local invoke TtsHandler --event backend/events/test-save.json

# Frontend
cd frontend
cp .env.example .env.local   # fill in your values
npm install
npm run dev                  # http://localhost:5173/language-learning-tts-phrasebook/
npm run build                # production build → dist/  (runs tsc, then vite build)
```

### Frontend structure

Organised by feature, not by file type. MUI handles all styling via two `createTheme()` objects — no global CSS file.

```
frontend/src/
├── main.tsx                    ← bootstrap → ThemeController → App
├── App.tsx                     ← shell layout (brand, date, theme toggle, settings)
├── theme/
│   ├── comic.ts / ink.ts       ← MUI themes
│   ├── augmentation.d.ts       ← adds `appName` + `accents` to MUI Theme
│   └── ThemeController.tsx     ← provider + useThemeController()
├── features/
│   ├── compose/                ← Composer, PhraseBubble, LanguagePicker, ModeSelector
│   ├── library/                ← Library, PhraseRow, LanguageGroup,
│   │                             EditPhraseModal, ConfirmDeleteModal
│   └── settings/SettingsModal
├── api/                        ← client (Lambda CRUD), tts (browser proxy), crypto (HMAC-TOTP)
├── domain/languages.ts         ← static language catalog
└── playback/player.ts          ← mode sequencer with cancellable PlayController
```

### Backend structure

```
backend/src/
├── handler.ts                  ← Lambda entry + composition root
├── domain.ts                   ← Phrase entity type
├── routes/phrases.ts           ← HTTP parsing → use cases
├── usecases/                   ← business logic (depends only on interfaces)
│   ├── savePhrase.ts           ← decode audioBase64 → S3 → DynamoDB
│   ├── listPhrases.ts
│   ├── updatePhrase.ts         ← patch transcription / translation
│   └── deletePhrase.ts
├── repositories/
│   └── phraseRepository.ts     ← IPhraseRepository + DynamoDB impl
├── services/
│   └── audioStore.ts           ← IAudioStore + S3 impl
└── utils/auth.ts               ← HMAC-TOTP (pure)
```

Use cases depend only on interfaces — swap in fakes for tests without touching AWS. The full HTTP contract lives in `openapi.yaml`.

---

## Abuse Protection

1. **HMAC-TOTP** (`x-app-token`): `HMAC-SHA256(secret, floor(now/30000))` — expires every 30 seconds, generated in the browser via Web Crypto API. Stops copy-paste replay attacks.
2. **Reserved concurrency = 2**: Hard cap on simultaneous Lambda executions. The 3rd concurrent request gets HTTP 429.

The secret is embedded in the JS bundle, so a motivated attacker who reads the source could generate tokens. The concurrency cap is the real backstop against abuse. The TTS token in `localStorage` is the user's own short-lived credential and never reaches Lambda.
