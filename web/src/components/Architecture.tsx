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

function LayerCard({
  accent,
  title,
  stack,
  children,
}: {
  accent: string;
  title: string;
  stack: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <p className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${accent}`}
        />
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          {title}
        </span>
      </p>
      <p className="mt-1 pl-5 text-[12px] font-medium text-faint">{stack}</p>
      <div className="mt-4 flex-1 border-t border-line-soft pt-4">{children}</div>
    </div>
  );
}

function MiniTitle({ children }: { children: string }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">
      {children}
    </p>
  );
}

function TickList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2 text-[13.5px] leading-6 text-ink-soft"
        >
          <span aria-hidden="true" className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-brand/50" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

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
          <h2 className="mt-4 max-w-2xl font-serif text-[30px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[34px]">
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

        {/* Request flow */}
        <Reveal delay={100}>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-6">
            {FLOW.map((step) => (
              <li key={step.n} className="bg-paper p-5">
                <p className="font-serif text-[13px] font-semibold text-faint">
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

        {/* Layers */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Reveal>
            <LayerCard accent="bg-violet-500" title="Mobile App" stack="Expo SDK 55 · React Native + TypeScript">
              <MiniTitle>Expo App</MiniTitle>
              <TickList
                items={[
                  "Notes / uploads, chat interface, study material, settings",
                ]}
              />
              <div className="mt-4">
                <MiniTitle>Source capture</MiniTitle>
                <TickList
                  items={[
                    "Expo Image Picker, PDF / image upload, camera integration",
                  ]}
                />
              </div>
              <div className="mt-4">
                <MiniTitle>Result UI</MiniTitle>
                <TickList
                  items={["Summaries, AI chat over SSE, study plans, flashcards"]}
                />
              </div>
            </LayerCard>
          </Reveal>

          <Reveal delay={70}>
            <LayerCard accent="bg-pink-500" title="Authentication" stack="Clerk">
              <MiniTitle>Clerk</MiniTitle>
              <TickList
                items={[
                  "Sign in / sign up",
                  "Email + Google OAuth",
                  "Session management, user management",
                  "JWT / session verified by every API call",
                ]}
              />
              <div className="mt-4">
                <MiniTitle>Backend API</MiniTitle>
                <TickList
                  items={[
                    "Bun + Express · REST /api/v1 + SSE chat streaming",
                    "Auth, rate-limit, CORS, Zod validation, logging",
                    "Routes: /auth /notes /sources /chat /documents /study /users /health",
                  ]}
                />
              </div>
            </LayerCard>
          </Reveal>

          <Reveal delay={140}>
            <LayerCard accent="bg-emerald-500" title="Application Layer" stack="Services · business logic">
              <MiniTitle>Note Service</MiniTitle>
              <TickList items={["Create · update · delete"]} />
              <div className="mt-4">
                <MiniTitle>Ingestion Service</MiniTitle>
                <TickList items={["Process PDF / web sources, queue jobs"]} />
              </div>
              <div className="mt-4">
                <MiniTitle>Chat Service</MiniTitle>
                <TickList items={["RAG with LangGraph, SSE streaming"]} />
              </div>
              <div className="mt-4">
                <MiniTitle>Study + User Services</MiniTitle>
                <TickList
                  items={[
                    "Flashcards · summaries · plans · quizzes",
                    "User data · preferences",
                  ]}
                />
              </div>
            </LayerCard>
          </Reveal>

          <Reveal>
            <LayerCard accent="bg-amber-500" title="Data Layer" stack="PostgreSQL + pgvector">
              <MiniTitle>PostgreSQL</MiniTitle>
              <TickList
                items={[
                  "Users, notes, documents, conversations, study plans, metadata",
                ]}
              />
              <div className="mt-4">
                <MiniTitle>pgvector</MiniTitle>
                <TickList
                  items={[
                    "Document embeddings, semantic search, vector similarity",
                  ]}
                />
              </div>
            </LayerCard>
          </Reveal>

          <Reveal delay={70}>
            <LayerCard accent="bg-purple-500" title="AI / RAG Layer" stack="LangGraph + OpenAI">
              <MiniTitle>LangGraph</MiniTitle>
              <TickList
                items={[
                  "RAG pipeline, tool calling, conversation flow, memory / context",
                ]}
              />
              <div className="mt-4">
                <MiniTitle>OpenAI</MiniTitle>
                <TickList
                  items={[
                    "GPT models for chat, text-embedding-3 for vectors",
                    "Grounded generation, structured JSON output",
                  ]}
                />
              </div>
            </LayerCard>
          </Reveal>

          <Reveal delay={140}>
            <LayerCard accent="bg-teal-600" title="Sources + Storage" stack="Firecrawl · Cloudflare R2">
              <MiniTitle>User sources</MiniTitle>
              <TickList items={["PDF files, images, typed text / notes"]} />
              <div className="mt-4">
                <MiniTitle>Web sources</MiniTitle>
                <TickList
                  items={["Firecrawl — crawl + extract the pages you add"]}
                />
              </div>
              <div className="mt-4">
                <MiniTitle>Cloudflare R2</MiniTitle>
                <TickList
                  items={[
                    "Original PDFs + images, public / private access, file metadata",
                  ]}
                />
              </div>
            </LayerCard>
          </Reveal>
        </div>

        {/* Async pipeline — wide */}
        <Reveal delay={80}>
          <div className="mt-4 rounded-2xl border border-line bg-night p-6 text-white sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="font-serif text-[20px] font-semibold tracking-tight">
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
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 font-serif text-[12px]">
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
