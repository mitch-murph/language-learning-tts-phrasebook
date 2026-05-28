# Language Learning TTS Phrasebook — Implementation Plan

## Context

Building a personal web app for language learning: user types a phrase, selects a language, and hears it spoken at a slow/deliberate "language teacher" pace via a custom Google TTS endpoint. The app saves a phrase library (DynamoDB) so past phrases can be browsed and replayed. Hosted on GitHub Pages. Lambda backend on AWS. Target cost: ~$0/month.

---

## Architecture

```
GitHub Pages (React/Vite)
    │
    │ POST /phrases  — generate audio + optionally save
    │ GET  /phrases  — list saved phrases
    │ DELETE /phrases/{id}
    │ + x-app-token: HMAC-TOTP (expires every 30s)
    ▼
Lambda (Node.js 20 + TypeScript) [ReservedConcurrency: 2]
    │
    ├─ verify HMAC-TOTP token
    │
    ├─ save=false → call TTS → return base64 audio to frontend (no S3)
    │
    └─ save=true  → call TTS → upload MP3 to S3 → write DynamoDB → return S3 URL
                                                         │
                                          ┌──────────────┘
                                          │
                    DynamoDB stores s3Key. Replay = frontend constructs
                    S3 URL from s3Key directly — no Lambda call needed.
```

---

## Why GitHub Pages (No S3/CloudFront for Frontend)

GitHub Pages is free, already HTTPS, and available with your portfolio. CloudFront would only have been needed to put HTTPS in front of an S3-hosted frontend — GitHub Pages eliminates that need entirely.

**Removed from scope:** ~~S3 frontend bucket~~, ~~CloudFront~~, ~~Origin Access Control~~.
**Kept:** S3 audio bucket, Lambda, DynamoDB.

---

## TTS Endpoint

```
POST https://cxl-services.appspot.com/proxy?url=https://texttospeech.googleapis.com/v1beta1/text:synthesize&token={TOKEN}
```

Request body Lambda sends:
```json
{
  "input": {
    "text": "...",
    "prompt": "Speak like a calm language tutor. Read the phrase slowly and clearly."
  },
  "voice": { "languageCode": "en-AU", "name": "Charon", "modelName": "gemini-3.1-flash-tts-preview" },
  "audioConfig": { "audioEncoding": "MP3", "speakingRate": 1 }
}
```

- **Pacing:** Controlled via the `prompt` field (natural language), not SSML.
- **Response:** `{ "audioContent": "<base64-MP3>" }` — Lambda base64-decodes the audio.
- **Token:** Short-lived OAuth2 token in the URL query param. User pastes the full URL (including token) into the Settings screen. Stored in `localStorage`, sent to Lambda as `x-tts-url` header. Lambda uses it directly as the POST target.

---

## S3 Audio Bucket

Public-read. CORS allows `GET` from `https://{github-username}.github.io`.

Only written to when `save=true`. Key schema:
```
audio/{languageCode}/{sha256_of_nfc_normalized_trimmed_text}.mp3
```

When a phrase is saved, the `s3Key` is stored in DynamoDB. Replay is done entirely client-side — the frontend constructs the public S3 URL from the stored `s3Key` and plays it directly, no Lambda involved.

---

## IaC: AWS SAM

YAML-based IaC purpose-built for Lambda + S3 + DynamoDB. Superset of CloudFormation with less boilerplate. `sam deploy --guided` for interactive first-time setup; `sam deploy` for all subsequent deploys.

---

## Secrets

| Secret | Stored in | Purpose |
|---|---|---|
| `HMAC_SECRET` | GitHub Secrets → Lambda env var + Vite build | TOTP token signing |
| `LAMBDA_URL` | GitHub Secrets → Vite build | Lambda Function URL (set after first deploy) |
| Full TTS proxy URL (incl. token) | Browser `localStorage` via Settings UI | Sent to Lambda as `x-tts-url` — never in codebase or deployment |

---

## Abuse Protection

### Layer 1: HMAC-TOTP Tokens
`x-app-token: HMAC-SHA256(sharedSecret, floor(Date.now() / 30000))` — valid for one 30-second window. Generated via Web Crypto API (`crypto.subtle`, no library needed). Lambda accepts current + previous window for clock skew. Stops copy-paste replay attacks; a determined attacker who reads the JS bundle could bypass it — the concurrency cap is the real backstop.

### Layer 2: Reserved Concurrency = 2
At most 2 concurrent Lambda executions; the 3rd gets HTTP 429. Lambda does **not** run continuously — only runs on invocation, you only pay for execution time.

---

## API Design

```
POST /phrases
  Headers:  x-app-token: <HMAC-TOTP>, x-tts-url: <full proxy URL>
  Body:     { text: string, languageCode: string, save: boolean,
              transcription?: string, translation?: string }

  save=false:
    → verify token → call TTS → return { audioBase64: string }
    (frontend decodes + plays via Web Audio API or Blob URL)

  save=true:
    → verify token → call TTS → upload MP3 to S3 → write DynamoDB
    → return { phraseId: string, s3Key: string }

GET /phrases
  Headers:  x-app-token: <HMAC-TOTP>
  Returns:  { phrases: Phrase[] }
  (each phrase includes s3Key; frontend constructs S3 URL for replay)

DELETE /phrases/{phraseId}
  Headers:  x-app-token: <HMAC-TOTP>
  Returns:  { success: true }
```

---

## DynamoDB Schema

Table: `tts-phrases` | Billing: Provisioned (1 WCU / 1 RCU — always free, never expires)

```
PK: userId      String  → "default" (single-user, no auth needed)
SK: phraseId    String  → UUID v4

Attributes:
  text          String    — phrase sent to TTS
  languageCode  String    — e.g. "ja-JP"; default "en-AU"
  s3Key         String    — S3 object key (used by frontend to construct playback URL)
  createdAt     String    — ISO 8601
  transcription String?   — romanization (e.g. "Ohayou gozaimasu")
  translation   String?   — English meaning (e.g. "Good morning")
```

DynamoDB "always-free" = 25 WCU / 25 RCU / 25 GB permanently.

---

## Project Structure

```
language-learning-tts-phrasebook/
├── PLAN.md
├── CLAUDE.md
├── template.yaml              ← SAM IaC (Lambda + audio S3 + DynamoDB)
├── samconfig.toml             ← SAM deploy defaults
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml ← sam deploy on push to main
│       └── deploy-frontend.yml← vite build + gh-pages deploy on push to main
├── frontend/                  ← React + Vite
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── PhraseInput.tsx   ← text + transcription + translation + language selector + play/save
│   │   │   ├── PhraseList.tsx    ← saved phrases with replay (client-side S3 URL) + delete
│   │   │   └── Settings.tsx      ← TTS proxy URL input, stored in localStorage
│   │   ├── api.ts               ← Lambda calls
│   │   └── crypto.ts            ← Web Crypto API HMAC-SHA256 token generation
│   ├── package.json
│   └── vite.config.ts
└── backend/
    ├── src/
    │   ├── handler.ts         ← Lambda entry point (routes by method + path)
    │   ├── tts.ts             ← TTS HTTP call + base64 decode + S3 upload (save=true only)
    │   ├── phrases.ts         ← DynamoDB CRUD
    │   └── auth.ts            ← HMAC-TOTP verification
    ├── package.json
    └── tsconfig.json
```

---

## Development Phases

### Phase 1 — Core TTS, test via curl (1 day)
1. Set up `backend/` with Node.js + TypeScript + esbuild
2. Implement `POST /phrases` (save=false): HMAC verify → call TTS → return audio
3. Write `template.yaml`: audio S3 bucket (public-read + CORS) + Lambda (Function URL, `ReservedConcurrency: 2`) + DynamoDB table
4. Add `HMAC_SECRET` to GitHub Secrets; write `deploy-backend.yml`
5. Push → workflow deploys → test with `curl` + valid HMAC-TOTP header

### Phase 2 — React Frontend on GitHub Pages (1 day)
1. Scaffold React + Vite
2. Implement `crypto.ts` and `api.ts`
3. Build `PhraseInput`: text + transcription + translation fields, language dropdown (default `en-AU`), Play and Save buttons
4. Build `Settings`: single field for full TTS proxy URL, saved to `localStorage`
5. Wire `POST /phrases` → play audio
6. Write `deploy-frontend.yml`; push → live on GitHub Pages

### Phase 3 — Phrase Library (1 day)
1. Implement save=true path in Lambda: TTS → S3 upload → DynamoDB write
2. Implement `GET /phrases` and `DELETE /phrases/{phraseId}`
3. Build `PhraseList`: text + transcription + translation, replay (constructs S3 URL client-side), delete
4. Deploy both layers

### Phase 4 — Polish (ongoing)
- Customisable pacing prompt in Settings
- Language filter/search in phrase list

---

## Monthly Cost Estimate

| Service | Cost |
|---|---|
| Google TTS (custom endpoint) | Depends on your plan; saved phrases are free to replay (direct S3) |
| Lambda | $0 — free tier: 1M invocations + 400K GB-sec/month |
| S3 audio | ~$0.01 |
| DynamoDB | $0 — always-free tier |
| GitHub Pages | $0 |
| **Total** | **~$0.01/month** |

---

## Verification Checklist

- [ ] Unit tests (jest): HMAC-TOTP verify, TTS call mock, DynamoDB write mock
- [ ] `sam local invoke` with test event JSON before first deploy
- [ ] End-to-end: push → GitHub Actions deploys → open GitHub Pages → enter phrase → audio plays at slow pace
- [ ] Save test: save a phrase → appears in phrase list → replay plays audio directly from S3 (no Lambda call)
- [ ] Concurrency test: fire 5 rapid requests → some return 429
- [ ] Token expiry test: copy `x-app-token` from network tab → replay 60s later → Lambda returns 401
