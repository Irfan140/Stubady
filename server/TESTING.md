# Server Auth Verification (Better Auth — Phase 1)

Manual checklist against local dev, written for the **Requestly API Client**.
Every item below was run (via curl equivalents) and passes — see "Results"
at the bottom.

## Prereqs

1. `docker compose up -d` from the repo root (Postgres + Redis).
2. `cd server && bun run --watch src/index.ts` — leave it running; you need
   its terminal output in step 2 (the OTP is logged there in dev only).

## Requestly setup

1. Create an API Client **Environment** (e.g. `stubady-local`) with:
   - `baseUrl` = `http://localhost:3000`
   - `token` = _(empty for now; filled in step 1/3)_
2. Use a fresh email per run (sign-up with an existing email returns 422).
3. Rule that applies to **every** request below: `POST {{baseUrl}}/api/auth/*`
   endpoints reject requests without an `Origin` header (Better Auth CSRF
   check) with `MISSING_OR_NULL_ORIGIN`. So on each auth POST, add header
   `Origin: {{baseUrl}}` plus `Content-Type: application/json`.
   `GET` requests and `Authorization: Bearer` calls to `/api/v1/*` do not
   need `Origin`.
4. Cookies: run the requests top-to-bottom in one Requestly session so the
   `better-auth.session_token` cookie set at sign-up/sign-in is reused by
   get-session, sign-out, and delete-user. If a cookie step ever returns
   `null` / 401 unexpectedly, re-run sign-in, or copy the cookie from the
   sign-in response headers into a manual `Cookie` header.

## 1. Email sign-up

- Method/URL: `POST {{baseUrl}}/api/auth/sign-up/email`
- Headers: `Content-Type: application/json`, `Origin: {{baseUrl}}`
- Body (JSON):
  ```json
  {
    "name": "Verify User",
    "email": "verify1@example.com",
    "password": "Testpass123!"
  }
  ```
- Expect `200` with `{ "token", "user": { "id", "emailVerified": false, … } }`,
  a `set-auth-token` response header, and a `better-auth.session_token`
  cookie. Copy the `set-auth-token` header value into the `{{token}}`
  environment variable, and note the `user.id`.
- The sign-up OTP is printed in the server terminal
  (`issued email verification OTP` — dev only, never in production).

## 2. OTP verify

Read the 6-digit `otp` from the server terminal, then:

- Method/URL: `POST {{baseUrl}}/api/auth/email-otp/verify-email`
- Headers: `Content-Type: application/json`
- Body (JSON):
  ```json
  { "email": "verify1@example.com", "otp": "<OTP_FROM_SERVER_LOG>" }
  ```
- Expect `200` with `{ "status": true, "user": { "emailVerified": true, … } }`.

To re-send a code explicitly (`POST {{baseUrl}}/api/auth/email-otp/send-verification-otp`):

```json
{ "email": "verify1@example.com", "type": "email-verification" }
```

## 3. Sign-in

- Method/URL: `POST {{baseUrl}}/api/auth/sign-in/email`
- Headers: `Content-Type: application/json`, `Origin: {{baseUrl}}`
- Body (JSON):
  ```json
  { "email": "verify1@example.com", "password": "Testpass123!" }
  ```
- Expect `200` with `{ "token", "user": { "emailVerified": true, … } }` plus
  a fresh `set-auth-token` header. Update `{{token}}` with the new value.

## 4. Get session (cookie)

- Method/URL: `GET {{baseUrl}}/api/auth/get-session`
- No headers needed (session cookie is sent automatically).
- Expect `200` with `{ "session": { "userId": "<id>", … }, "user": {…} }`.

## 5. Protected route with Bearer token

- Method/URL: `GET {{baseUrl}}/api/v1/study-sets`
- Headers: `Authorization: Bearer {{token}}`
- Expect `200` (e.g. `{ "data": [], "nextCursor": null }`). The legacy
  `x-access-token: {{token}}` header works the same way.

Negative cases (exact 401 bodies preserved from the old middleware):

- Same URL with no auth headers → `{"error":"Missing bearer token"}`
- `Authorization: Bearer garbage` → `{"error":"Invalid or expired token"}`

## 6. Sign-out

- Method/URL: `POST {{baseUrl}}/api/auth/sign-out`
- Headers: `Origin: {{baseUrl}}` (session cookie sent automatically).
- Expect `{"success":true}`. Re-run step 4 → expect `null`.

## 7. Delete user (purge check)

Seed one study set first so the purge has something to remove:

- Method/URL: `POST {{baseUrl}}/api/v1/study-sets`
- Headers: `Authorization: Bearer {{token}}`,
  `Content-Type: application/json`
- Body (JSON): `{ "title": "Purge Test Set" }`

Sign in again (step 3) for a fresh session cookie, then delete (password
required):

- Method/URL: `POST {{baseUrl}}/api/auth/delete-user`
- Headers: `Content-Type: application/json`, `Origin: {{baseUrl}}`
- Body (JSON): `{ "password": "Testpass123!" }`
- Expect `{"success":true,"message":"User deleted"}`.

Confirm the purge (run in a terminal — these are server-side checks, not
Requestly requests):

```bash
# DB rows (user/session/account/study data) — expect all zeros:
docker exec studybuddy-db psql -U myuser -d studybuddy \
  -c 'SELECT (SELECT count(*) FROM "user") AS users, (SELECT count(*) FROM session) AS sessions, (SELECT count(*) FROM account) AS accounts, (SELECT count(*) FROM study_sets) AS study_sets;'

# R2 prefix users/<id>/ — expect an empty listing (server log shows
# "purged data for deleted user" with studySetsDeleted: 1).
```

## Results (2026-10-08, local dev)

| #   | Check                                                 | Result                                   |
| --- | ----------------------------------------------------- | ---------------------------------------- |
| 1   | Boot `bun run --watch src/index.ts`, no errors        | PASS (after `prisma generate`; see note) |
| 2   | Sign-up → 200 + `set-auth-token` + cookie, OTP logged | PASS                                     |
| 3   | OTP verify → `emailVerified: true`                    | PASS                                     |
| 4   | Sign-in → 200 + fresh token                           | PASS                                     |
| 5   | `get-session` with cookie                             | PASS                                     |
| 6   | Protected route with `Authorization: Bearer`          | PASS (`{"data":[],"nextCursor":null}`)   |
| 7   | Exact 401 bodies + `x-access-token` fallback          | PASS                                     |
| 8   | Sign-out → session `null`                             | PASS                                     |
| 9   | Delete user → DB rows `0/0/0/0`, R2 prefix empty      | PASS                                     |
| 10  | `bunx tsc --noEmit`, `bun run lint`                   | PASS                                     |

Notes:

- First boot after the schema change failed Better Auth startup validation
  (`Prisma schema mismatch … Missing tables`) because the generated client
  was stale; re-running `bunx --bun prisma generate` (or restarting after the
  migration, which regenerates it) fixes it. Not a code issue.
- If any `POST {{baseUrl}}/api/auth/*` request returns
  `MISSING_OR_NULL_ORIGIN`, the `Origin` header is missing — add
  `Origin: {{baseUrl}}`.
- Google OAuth was configured (`GOOGLE_CLIENT_ID/SECRET` validated at boot)
  but the browser redirect flow was not exercised — needs real credentials
  plus the Phase 2 mobile client.
- OTPs are logged via Pino in non-production only so API-client testing
  works without an email provider. Production has no email sender yet —
  wire one into `sendVerificationOTP` in `src/lib/auth.ts` before launch.
