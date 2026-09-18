import archImg from "../assets/stubady_architecture.png";
import { Reveal } from "./Reveal";

const FLOW = [
  {
    n: "01",
    title: "Capture",
    body: "PDFs, images, notes, or web links from the Expo app.",
  },
  {
    n: "02",
    title: "API validates",
    body: "Bun + Express checks auth (Clerk JWT), Zod, rate limits.",
  },
  {
    n: "03",
    title: "Job queued",
    body: "Ingestion job lands in BullMQ + Redis with retries.",
  },
  {
    n: "04",
    title: "Worker processes",
    body: "Fetch, extract, chunk, embed, store in pgvector + R2.",
  },
  {
    n: "05",
    title: "RAG answers",
    body: "LangGraph retrieves chunks, OpenAI generates with citations.",
  },
  {
    n: "06",
    title: "Stream back",
    body: "SSE streams chat, summaries, decks to the Result UI.",
  },
];

const STACK = [
  {
    title: "Mobile app",
    stack: "Expo SDK 55 · React Native + TypeScript",
    body: "Study sets, source capture (PDF, notes, web), grounded chat over SSE, summaries, and flashcard decks.",
  },
  {
    title: "Authentication",
    stack: "Clerk",
    body: "Email and Google sign-in; every API call verifies the JWT session.",
  },
  {
    title: "Backend API",
    stack: "Bun + Express",
    body: "REST plus SSE chat streaming, with auth, rate limits, and validation.",
  },
  {
    title: "Application layer",
    stack: "Services",
    body: "Ingestion, chat (RAG with LangGraph), flashcards, summaries, and user data.",
  },
  {
    title: "Data layer",
    stack: "PostgreSQL + pgvector",
    body: "Users, sets, sources, and conversations, plus embeddings for semantic search.",
  },
  {
    title: "AI layer",
    stack: "LangGraph + OpenAI",
    body: "Retrieval, grounded generation with citations, and streamed replies.",
  },
  {
    title: "Sources + storage",
    stack: "Firecrawl · Cloudflare R2",
    body: "Web extraction plus original file storage with metadata.",
  },
];

export function Architecture() {
  return (
    <section id="architecture" aria-label="System architecture" className="scroll-mt-20 border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <p className="flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
            <span aria-hidden="true" className="inline-block h-px w-7 bg-brand" />
            Under the hood
          </p>
        </Reveal>
        <Reveal delay={70}>
          <h2 className="mt-4 max-w-2xl text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            The same architecture in the diagram, live on the site.
          </h2>
        </Reveal>
        <Reveal delay={130}>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted">
            Capture on mobile, process on the backend, retrieve with RAG.
            Every layer below maps one-to-one to the system diagram — from
            Clerk auth to BullMQ workers to pgvector search.
          </p>
        </Reveal>

        {/* Diagram */}
        <Reveal delay={140}>
          <figure className="mt-10 overflow-hidden rounded-2xl border border-line bg-night">
            <img
              src={archImg}
              alt="Stubady system architecture — mobile app, Clerk auth, Bun Express API, services, PostgreSQL plus pgvector, LangGraph plus OpenAI, BullMQ ingestion pipeline, R2 storage"
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </figure>
        </Reveal>

        {/* Request flow */}
        <Reveal delay={100}>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-6">
            {FLOW.map((step) => (
              <li key={step.n} className="bg-paper p-5">
                <p className="text-[11px] font-bold tracking-widest text-faint">
                  {step.n}
                </p>
                <p className="mt-1.5 text-[14px] font-semibold text-ink">
                  {step.title}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-6 text-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal>
          <p className="mx-auto mt-5 max-w-3xl text-center text-[13px] leading-6 text-faint">
            Mobile → Backend over HTTPS (REST + SSE) · Backend ↔ Clerk over
            JWT / session · Backend → Queue as “Create Ingestion Job” ·
            Worker → OpenAI for embeddings · Chat → LangGraph for
            retrieve + generate
          </p>
        </Reveal>

        {/* Full stack, collapsed — the flow above is the story */}
        <Reveal>
          <details className="mt-10 rounded-2xl border border-line bg-paper px-6 py-5 sm:px-8">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              For the curious: the full stack
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-[16px] font-normal text-muted"
              >
                +
              </span>
            </summary>
            <dl className="mt-5 grid gap-x-10 gap-y-5 border-t border-line-soft pt-5 md:grid-cols-2">
              {STACK.map((layer) => (
                <div key={layer.title}>
                  <dt className="text-[14px] font-semibold text-ink">
                    {layer.title}{" "}
                    <span className="font-normal text-faint">
                      · {layer.stack}
                    </span>
                  </dt>
                  <dd className="mt-1 text-[13.5px] leading-6 text-muted">
                    {layer.body}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        </Reveal>

        {/* Async pipeline — wide */}
        <Reveal delay={80}>
          <div className="mt-4 rounded-2xl border border-line bg-night p-6 text-white sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-[20px] font-extrabold tracking-tight">
                Async ingestion pipeline
              </h3>
              <p className="text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#a9b8e8]">
                BullMQ + Redis
              </p>
            </div>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  t: "Job Queue",
                  s: "BullMQ",
                  items: [
                    "Add ingestion jobs",
                    "Track status",
                    "Retry / failure handling",
                  ],
                },
                {
                  t: "Worker",
                  s: "Ingestion processor",
                  items: [
                    "Fetch source → extract content → chunk text",
                    "Generate embeddings",
                    "Store in pgvector",
                  ],
                },
                {
                  t: "Job Status",
                  s: "Visible in app",
                  items: ["Processing", "Completed", "Failed — with retry, never silent"],
                },
              ].map((col, i) => (
                <li
                  key={col.t}
                  className="rounded-xl border border-white/15 bg-white/[0.04] p-5"
                >
                  <p className="flex items-center gap-2.5 text-[13px] font-semibold">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[12px] font-bold">
                      {i + 1}
                    </span>
                    {col.t}
                    <span className="font-normal text-[#8e9cc4]">· {col.s}</span>
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {col.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[13px] leading-6 text-[#c3cde9]">
                        <span aria-hidden="true" className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-[#a9b8e8]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-center text-[12.5px] leading-6 text-[#8e9cc4]">
              This is why sources move from queued → processing → ready in the
              app — the worker is doing the heavy lifting in the background.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
