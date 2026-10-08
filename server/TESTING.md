# Server Auth Verification (Better Auth — Phase 1)

Manual checklist against local dev. Every item below was run and passes
(see "Results" at the bottom).

Prereqs: `docker compose up -d` (repo root, Postgres + Redis), then:

```bash
cd server
bun run --watch src/index.ts
```

Conventions used below (bash syntax; on Windows PowerShell write each JSON
body to a file and pass it with `-d @file`):

```bash
BASE=http://localhost:3000
ORIGIN="Origin: $BASE" # POST /api/auth/* rejects requests without Origin (CSRF check)
JAR=/tmp/ba-jar.txt    # cookie jar for the session-cookie steps
```

Use a fresh email per run (sign-up with an existing email returns 422).

## 1. Email sign-up

```bash
curl -s -i -c $JAR -H "Content-Type: application/json" -H "$ORIGIN" \
  -d '{"name":"Verify User","email":"verify1@example.com","password":"Testpass123!"}' \
  $BASE/api/auth/sign-up/email
```

Expect `200` with `{ "token", "user": { "id", "emailVerified": false, ... } }`,
a `set-auth-token: <TOKEN>` response header, and a
`better-auth.session_token` cookie. The sign-up OTP is logged by the server
(`issued email verification OTP` — dev only, never in production).

## 2. OTP verify

Read the 6-digit `otp` from the server log, then:

```bash
curl -s -H "Content-Type: application/json" \
  -d '{"email":"verify1@example.com","otp":"<OTP_FROM_LOG>"}' \
  $BASE/api/auth/email-otp/verify-email
```

Expect `200` with `{ "status": true, "user": { "emailVerified": true, ... } }`.

To re-send a code explicitly:

```bash
curl -s -H "Content-Type: application/json" \
  -d '{"email":"verify1@example.com","type":"email-verification"}' \
  $BASE/api/auth/email-otp/send-verification-otp
```

## 3. Sign-in

```bash
curl -s -i -c $JAR -H "Content-Type: application/json" -H "$ORIGIN" \
  -d '{"email":"verify1@example.com","password":"Testpass123!"}' \
  $BASE/api/auth/sign-in/email
```

Expect `200` with `{ "token", "user": { "emailVerified": true, ... } }` plus a
fresh `set-auth-token` header. Save it as `$TOKEN` for step 5.

## 4. Get session (cookie)

```bash
curl -s -b $JAR $BASE/api/auth/get-session
```

Expect `200` with `{ "session": { "userId": "<id>", ... }, "user": {...} }`.

## 5. Protected route with Bearer token

```bash
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/study-sets
```

Expect `200` (e.g. `{ "data": [], "nextCursor": null }`). The legacy
`x-access-token: $TOKEN` fallback header works the same way.

Negative cases (exact 401 bodies preserved from the old middleware):

```bash
curl -s $BASE/api/v1/study-sets
# {"error":"Missing bearer token"}

curl -s -H "Authorization: Bearer garbage" $BASE/api/v1/study-sets
# {"error":"Invalid or expired token"}
```

## 6. Sign-out

```bash
curl -s -X POST -H "$ORIGIN" -b $JAR -c $JAR $BASE/api/auth/sign-out
# {"success":true}

curl -s -b $JAR $BASE/api/auth/get-session
# null
```

## 7. Delete user (purge check)

Seed one study set plus an R2 object first so the purge has something to
remove (any protected endpoint works; study-set creation shown):

```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Purge Test Set"}' $BASE/api/v1/study-sets
```

Sign in again for a fresh session cookie, then delete (password required):

```bash
curl -s -c $JAR -H "Content-Type: application/json" -H "$ORIGIN" \
  -d '{"email":"verify1@example.com","password":"Testpass123!"}' \
  $BASE/api/auth/sign-in/email

curl -s -H "Content-Type: application/json" -H "$ORIGIN" -b $JAR \
  -d '{"password":"Testpass123!"}' \
  $BASE/api/auth/delete-user
# {"success":true,"message":"User deleted"}
```

Confirm the purge:

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
- POST `/api/auth/*` requires an `Origin` header (Better Auth CSRF check);
  plain curl without one gets `MISSING_OR_NULL_ORIGIN`. GETs and
  `Authorization: Bearer` calls to `/api/v1/*` do not need it.
- Google OAuth was configured (`GOOGLE_CLIENT_ID/SECRET` validated at boot)
  but the browser redirect flow was not exercised — needs real credentials
  plus the Phase 2 mobile client.
- OTPs are logged via Pino in non-production only so API-client testing
  works without an email provider. Production has no email sender yet —
  wire one into `sendVerificationOTP` in `src/lib/auth.ts` before launch.
