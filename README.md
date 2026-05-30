# Language Learning TTS Phrasebook

A personal web app for language learning. Type a phrase, hear it spoken at a slow "language teacher" pace, and save it to a searchable library with optional romanisation and English translation.

**Live:** `https://mitcmurph.github.io/language-learning-tts-phrasebook`

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite → GitHub Pages |
| Backend | AWS Lambda (Node.js 20 + TypeScript) via Lambda Function URL |
| Database | DynamoDB (provisioned 1 WCU / 1 RCU — always-free tier) |
| Audio storage | S3 public bucket (content-addressed by SHA-256) |
| IaC | AWS SAM |
| CI/CD | GitHub Actions |
| TTS | Google TTS v1beta1 via `cxl-services.appspot.com` proxy (`Charon` / Gemini model) |

**Cost:** ~$0.01/month. Everything within AWS free tiers.

---

## How It Works

```
Browser (GitHub Pages)
  │  POST /phrases  x-app-token + x-tts-url
  ▼
Lambda Function URL
  ├─ save=false → call TTS → return base64 audio → browser plays it
  └─ save=true  → call TTS → upload MP3 to S3 → write DynamoDB → return s3Key
                                                        │
                              Replay later: browser constructs S3 URL from s3Key
                              and plays directly — no Lambda call needed
```

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

1. Open `https://<your-username>.github.io/language-learning-tts-phrasebook`
2. Click **Settings** and paste your TTS proxy URL (including `?token=...`) and the Audio Base URL from SAM outputs
3. Type a phrase, select a language, and hit **Play** to hear it or **Save** to add it to your library
4. Saved phrases appear in the library below — replay them directly from S3 (no Lambda call) or delete them

The TTS OAuth2 token is short-lived. When audio stops working, open Settings and paste a fresh URL.

---

## Development

```bash
# Backend
cd backend
npm install
npm run build          # esbuild bundle → dist/handler.js
npm run build:watch    # watch mode

# Test locally with SAM
sam local invoke TtsHandler --event backend/events/test-synthesize.json

# Frontend
cd frontend
cp .env.example .env.local   # fill in your values
npm install
npm run dev                  # http://localhost:5173/language-learning-tts-phrasebook/
npm run build                # production build → dist/
```

### Backend architecture

```
backend/src/
├── handler.ts               ← Lambda entry + composition root
├── domain.ts                ← Phrase entity type
├── routes/phrases.ts        ← HTTP parsing → use cases
├── usecases/                ← business logic (depends only on interfaces)
│   ├── synthesizePhrase.ts
│   ├── savePhrase.ts
│   ├── listPhrases.ts
│   └── deletePhrase.ts
├── repositories/
│   └── phraseRepository.ts  ← IPhraseRepository + DynamoDB impl
├── services/
│   ├── ttsService.ts        ← ITtsService + HTTP impl
│   └── audioStore.ts        ← IAudioStore + S3 impl
└── utils/auth.ts            ← HMAC-TOTP (pure)
```

Use cases depend only on interfaces — swap in fakes for tests without touching AWS.

---

## Abuse Protection

1. **HMAC-TOTP** (`x-app-token`): `HMAC-SHA256(secret, floor(now/30000))` — expires every 30 seconds, generated in the browser via Web Crypto API. Stops copy-paste replay attacks.
2. **Reserved concurrency = 2**: Hard cap on simultaneous Lambda executions. The 3rd concurrent request gets HTTP 429.

The secret is embedded in the JS bundle, so a motivated attacker who reads the source could generate tokens. The concurrency cap is the real backstop against abuse.
