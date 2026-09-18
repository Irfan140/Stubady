# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Primary user is the builder themselves, using Stubady for personal study and revision from their own materials. No targeted user base or audience segment has been decided — this is a personal project first.

Open decision: whether to target a broader audience (e.g. higher-ed, high-school, self-learners) is undecided and must not be assumed by future work.

## Product Purpose

Stubady is an AI study companion that turns the user's own materials into an interactive learning experience. The user gathers PDFs, typed/pasted notes, and web links into a study set, then questions, summarizes, and revises that material with AI help.

Success means revision that is faster, more focused, and personal to the user's content — less time hunting files and re-reading, more time recalling and verifying.

## Positioning

Answers come only from the user's own provided sources, with citations naming the document and section — never from the open internet. If the sources do not cover a question, Stubady says what is missing instead of inventing an answer.

## Operating Context

Core workflow, confirmed in app and marketing copy:

1. Create one study set per subject or exam — home for its sources, chats, summaries, and decks.
2. Add sources: PDF upload, typed/pasted notes, web link. Each source is extracted and processed in the background (queued → processing → ready/failed) via server + BullMQ worker.
3. Study: grounded chat with streaming replies and citations, on-demand Markdown summaries, AI-generated Q&A flashcard decks, paginated conversation history.

Environments: Expo native mobile app (iOS + Android, portrait, OTA via EAS Update) is the product; `web/` (Vite + React + Tailwind SPA, routes `home` / `privacy` / `delete-account`) is marketing, privacy, and delete-account only. Backend is Bun + Express 5 API with Clerk auth (Google sign-in shares name, email, profile photo only), Prisma 7 + PostgreSQL + pgvector, Redis + BullMQ ingestion, LangChain/LangGraph + OpenAI, Firecrawl for web sources, Cloudflare R2 for PDFs.

## Capabilities and Constraints

Confirmed functionality:

- Study Sets group sources, chats, summaries, and decks per subject/exam.
- Multi-source ingestion: PDFs, notes, web pages; chunked and searchable; only `ready` sources are used by study tools.
- Grounded chat with citations and streaming; says when material is missing.
- Auto summaries on demand per study set.
- Smart flashcard decks generated from sources, with history.
- Paginated conversation history and past-source access.
- User data control: delete sources, summaries, sets, or whole account at any time.

Terminology: study set, source (pdf | note | web), chat/conversation, summary, deck/card.

Explicitly undecided: target audience, pricing/monetization, sharing/collaboration, offline support, required accessibility standard.

## Brand Commitments

Name: Stubady (slug `studbady`). Confirmed voice from shipped web copy: "Study from your notes, not the whole internet." No binding visual constraints (palette, type, imagery direction) were given during init and none are recorded here.

## Evidence on Hand

Real assets and copy (do not fabricate beyond these):

- `assets/Home.png`, `assets/source.png`, `assets/study_set.png` — mobile screenshots.
- `assets/architecture.png` and `web/src/assets/stubady_architecture.png` — system architecture diagrams.
- `web/src/pages/Home.tsx` — shipped marketing claims, how-it-works, FAQ, and trust copy.
- `mobile/src/app/` (Expo Router screens) and `server/src/` (API, workers, services) — incumbent implementation.

Absences future work must not invent: testimonials, customers, case studies, benchmarks, pricing, store ratings, press.

## Product Principles

1. My materials are the source of truth — Stubady layers questioning, condensing, and testing on top of what the user already has.
2. Cite or admit the gap — every claim points at its source; missing coverage is stated, never papered over.
3. One set per subject keeps study coherent — chat, summary, and decks never drift apart because they share the same sources.
4. Recall beats re-reading — summaries and flashcards serve active testing, not comfortable highlighting.
5. The user owns their library — anything added can be removed completely, including the whole account.
