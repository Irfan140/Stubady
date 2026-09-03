import { ProductVisual } from "../components/ProductVisual";
import { Reveal } from "../components/Reveal";
import {
  CardsIcon,
  ChatIcon,
  CheckIcon,
  LibraryIcon,
  NoteIcon,
  PdfIcon,
  SourceIcon,
  SummaryIcon,
} from "../components/icons";
import { goToSection, navigate } from "../router";

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
      <span aria-hidden="true" className="inline-block h-px w-7 bg-brand" />
      {children}
    </p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="max-w-2xl">
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={70}>
        <h2 className="mt-4 font-serif text-[30px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[34px]">
          {title}
        </h2>
      </Reveal>
      {lede ? (
        <Reveal delay={130}>
          <p className="mt-4 text-[16px] leading-7 text-muted">{lede}</p>
        </Reveal>
      ) : null}
    </div>
  );
}

const PIPELINE = [
  { label: "Add sources", detail: "PDFs, notes, links" },
  { label: "One study set", detail: "Per subject or exam" },
  { label: "Study", detail: "Chat · summaries · decks" },
];

const PAINS = [
  {
    n: "01",
    title: "Material scattered everywhere",
    body: "Slides in one folder, notes in another, three tabs you swear you'll read later. Revision starts with twenty minutes of searching.",
  },
  {
    n: "02",
    title: "Generic answers you can't trust",
    body: "General-purpose chatbots answer from the whole internet. You get a confident paragraph with no idea which page — if any — it came from.",
  },
  {
    n: "03",
    title: "Re-reading feels like progress",
    body: "Highlighting the same PDF for the third time is comfortable and mostly useless. Recall — questions, summaries, testing — is what sticks.",
  },
];

const TOOLS = [
  {
    icon: ChatIcon,
    name: "Chat with your materials",
    body: "Ask questions in plain language and get answers drawn from the sources in that study set — with citations naming the document and section, so you can verify in seconds. Replies stream in as they're written.",
    example: (
      <div className="rounded-xl border border-line bg-paper p-4">
        <p className="text-[13px] font-medium leading-6 text-ink">
          “Summarise the difference between mitosis and meiosis, using only my
          sources.”
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-md border border-line bg-card px-2 py-1 text-[11px] font-medium text-muted">
            lecture-notes.pdf · p. 6
          </span>
          <span className="rounded-md border border-line bg-card px-2 py-1 text-[11px] font-medium text-muted">
            Mitosis stages · §4
          </span>
        </div>
      </div>
    ),
  },
  {
    icon: SummaryIcon,
    name: "Summaries on demand",
    body: "Generate a clean, readable summary of any study set whenever you need one — before a lecture, the night before an exam, or when a 40-page PDF needs to become two pages.",
    example: (
      <div className="rounded-xl border border-line bg-paper p-4 font-serif text-[14.5px] leading-7 text-ink-soft">
        <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-faint">
          Summary · Cell division
        </p>
        <p className="mt-2">
          <strong className="font-semibold text-ink">Key stages.</strong>{" "}
          Prophase condenses chromatin; metaphase aligns chromosomes;
          anaphase separates sister chromatids…
        </p>
      </div>
    ),
  },
  {
    icon: CardsIcon,
    name: "Flashcards from your sources",
    body: "Turn processed material into question-and-answer decks sized to your session. Review the latest deck, keep a history of past ones, and revise in short loops instead of long re-reads.",
    example: (
      <div className="rounded-xl border border-line bg-paper p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
          Card 4 of 18
        </p>
        <p className="mt-1.5 font-serif text-[16.5px] leading-7 text-ink">
          Which stage follows metaphase, and what moves where?
        </p>
        <p className="mt-2 border-t border-line-soft pt-2 text-[13px] leading-6 text-muted">
          Anaphase — sister chromatids separate toward opposite poles.
        </p>
      </div>
    ),
  },
  {
    icon: LibraryIcon,
    name: "A library that keeps up",
    body: "Every subject gets its own study set with its sources, chats, summaries, and decks. Conversation history is paginated and searchable, so last month's revision is still there when finals arrive.",
    example: (
      <ul className="divide-y divide-line-soft rounded-xl border border-line bg-paper px-4">
        {[
          ["Biology 101", "3 sources · 2 decks"],
          ["Organic chemistry", "5 sources · 1 deck"],
          ["History: Cold War", "2 sources · 4 chats"],
        ].map(([t, s]) => (
          <li key={t} className="flex items-baseline justify-between gap-3 py-2.5">
            <span className="text-[13.5px] font-semibold text-ink">{t}</span>
            <span className="text-[12px] text-faint">{s}</span>
          </li>
        ))}
      </ul>
    ),
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create a study set",
    body: "One set per subject or exam. Give it a name — “Biology 101” — and it becomes the home for everything related.",
  },
  {
    n: "02",
    title: "Add your sources",
    body: "Upload a PDF, paste or type notes, drop in a web link. Each source is extracted and processed — queued, processing, then ready — before study tools use it.",
  },
  {
    n: "03",
    title: "Ask, summarise, revise",
    body: "Chat with citations, generate a summary, build a flashcard deck. Everything stays attached to the set, ready for the next session.",
  },
];

const FAQS = [
  {
    q: "What can I add as a source?",
    a: "PDF documents, typed or pasted notes, and web pages. Each source is processed automatically and marked queued, processing, ready, or failed — study tools only draw on sources that are ready.",
  },
  {
    q: "How do I know an answer is trustworthy?",
    a: "Answers include citations pointing at the source document and section they came from, so you can open the material and check. If your sources don't cover a question, Stubady says so instead of inventing an answer.",
  },
  {
    q: "Is Stubady a replacement for my notes?",
    a: "No — it's a layer on top of them. Your materials remain the source of truth; Stubady helps you question, condense, and test yourself on what's already there.",
  },
  {
    q: "What happens to my data?",
    a: "Your study materials belong to you. You can delete sources, study sets, or your whole account at any time — deletion removes them and their generated study material. See the privacy policy for the full details.",
  },
];

export function Home() {
  return (
    <main>
      {/* ——— Hero ——— */}
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-24 lg:pt-20">
          <div>
            <Reveal>
              <Eyebrow>Study with your own materials</Eyebrow>
            </Reveal>
            <Reveal delay={70}>
              <h1 className="mt-5 font-serif text-[clamp(2.35rem,5.2vw,3.55rem)] font-semibold leading-[1.08] tracking-tight text-ink">
                Study from your notes, not the whole internet.
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 max-w-xl text-[16.5px] leading-7 text-muted">
                Stubady gathers your PDFs, notes, and links into one focused
                study set — then helps you question it, summarise it, and turn
                it into flashcards. Every answer cites the source it came from.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => goToSection("download")}
                  className="rounded-lg bg-brand px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-deep"
                >
                  Get Stubady free
                </button>
                <button
                  type="button"
                  onClick={() => goToSection("how")}
                  className="rounded-lg border border-line bg-card px-6 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-cream/60"
                >
                  See how it works
                </button>
              </div>
            </Reveal>
            <Reveal delay={260}>
              <ul className="mt-7 flex flex-col gap-2 text-[13.5px] text-muted sm:flex-row sm:flex-wrap sm:gap-x-5">
                {[
                  "Free to start",
                  "PDFs, notes & web links",
                  "Answers cite your sources",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-moss" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={160} className="lg:pl-2">
            <ProductVisual />
          </Reveal>
        </div>
      </section>

      {/* ——— Pipeline strip ——— */}
      <section aria-label="How Stubady fits together" className="border-y border-line bg-cream/50">
        <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
          <Reveal>
            <ol className="grid gap-5 sm:grid-cols-3 sm:gap-0">
              {PIPELINE.map((step, i) => (
                <li
                  key={step.label}
                  className={`flex items-start gap-3.5 sm:px-7 ${
                    i === 0 ? "sm:pl-0" : "sm:border-l sm:border-line"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-night font-serif text-[14px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-semibold text-ink">
                      {step.label}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted">
                      {step.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ——— Why ——— */}
      <section id="why" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHeading
              eyebrow="The problem"
              title="Revision fails before it starts."
              lede="Most study time isn't spent learning. It's spent hunting down files, doubting chatbot answers, and re-reading pages that never quite stick."
            />
          </div>
          <Reveal as="ol" delay={100} className="divide-y divide-line border-y border-line">
            {PAINS.map((pain) => (
              <li key={pain.n} className="grid gap-2 py-7 sm:grid-cols-[52px_1fr] sm:gap-4">
                <span className="font-serif text-[15px] font-semibold text-faint">
                  {pain.n}
                </span>
                <span>
                  <span className="block font-serif text-[20px] font-semibold leading-snug text-ink">
                    {pain.title}
                  </span>
                  <span className="mt-2 block max-w-lg text-[15px] leading-7 text-muted">
                    {pain.body}
                  </span>
                </span>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ——— Tools ——— */}
      <section id="tools" className="scroll-mt-20 border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Study tools"
            title="One study set. Everything you need around it."
            lede="Sources go in; understanding comes out. Each tool works on the same materials, so your chat, summary, and flashcards never drift apart."
          />
          <ol className="mt-12">
            {TOOLS.map((tool, i) => (
              <Reveal as="li" key={tool.name} delay={i === 0 ? 60 : 0}>
                <div
                  className={`grid items-center gap-6 border-t border-line py-10 lg:grid-cols-2 lg:gap-14 ${
                    i === TOOLS.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <p className="flex items-center gap-2.5 text-brand">
                      <tool.icon className="h-5 w-5" />
                      <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </p>
                    <h3 className="mt-3 font-serif text-[24px] font-semibold tracking-tight text-ink">
                      {tool.name}
                    </h3>
                    <p className="mt-3 max-w-lg text-[15px] leading-7 text-muted">
                      {tool.body}
                    </p>
                  </div>
                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>{tool.example}</div>
                </div>
              </Reveal>
            ))}
          </ol>

          {/* Source types */}
          <Reveal>
            <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-line bg-paper p-6 sm:p-8 lg:flex-row lg:items-center">
              <p className="font-serif text-[19px] font-semibold text-ink lg:max-w-[240px] lg:shrink-0">
                Three ways in. Zero reformatting.
              </p>
              <ul className="grid flex-1 gap-4 sm:grid-cols-3">
                {[
                  { icon: PdfIcon, t: "PDF documents", s: "Upload readings & slides" },
                  { icon: NoteIcon, t: "Typed notes", s: "Paste or write directly" },
                  { icon: SourceIcon, t: "Web pages", s: "Drop in a link" },
                ].map((s) => (
                  <li key={s.t} className="flex items-start gap-3 rounded-xl border border-line-soft bg-card p-4">
                    <s.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                    <span>
                      <span className="block text-[14px] font-semibold text-ink">{s.t}</span>
                      <span className="mt-0.5 block text-[13px] text-muted">{s.s}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ——— How it works ——— */}
      <section id="how" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            eyebrow="How it works"
            title="From scattered files to a study session in minutes."
          />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.n} delay={i * 80} className="bg-paper">
                <div className="flex h-full flex-col p-7 sm:p-8">
                  <p className="font-serif text-[40px] font-semibold leading-none text-brand/25">
                    {step.n}
                  </p>
                  <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[14.5px] leading-7 text-muted">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal>
            <p className="mx-auto mt-6 max-w-2xl text-center text-[13.5px] leading-6 text-faint">
              Sources are processed in the background — you’ll see them move
              from queued to processing to ready. If one fails, you get a clear
              error and a retry, never a silent gap.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ——— Trust band ——— */}
      <section aria-label="Why you can trust Stubady" className="border-y border-line bg-cream/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <Reveal>
            <Eyebrow>Grounded by design</Eyebrow>
            <blockquote className="mt-5 font-serif text-[clamp(1.5rem,3.4vw,2.1rem)] font-medium leading-[1.3] tracking-tight text-ink">
              “If a claim isn’t in your sources, Stubady doesn’t make it. It
              tells you what’s missing instead.”
            </blockquote>
            <p className="mt-4 text-[14px] text-faint">
              Grounded answers · visible citations · your materials stay yours
            </p>
          </Reveal>
          <Reveal delay={120} as="ul" className="flex flex-col justify-center gap-4">
            {[
              ["Citations on every answer", "Each reply points to the document and section it used."],
              ["Only ready sources count", "Unprocessed or failed material is never silently included."],
              ["Delete anything, any time", "Remove a source, a set, or your whole account — for good."],
            ].map(([t, s]) => (
              <li key={t} className="flex gap-3.5 rounded-xl border border-line bg-card p-5">
                <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-moss" />
                <span>
                  <span className="block text-[14.5px] font-semibold text-ink">{t}</span>
                  <span className="mt-1 block text-[13.5px] leading-6 text-muted">{s}</span>
                </span>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section aria-label="Questions" className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-24">
          <div>
            <SectionHeading
              eyebrow="Questions"
              title="Asked before you ask."
            />
            <Reveal delay={140}>
              <p className="mt-5 text-[15px] leading-7 text-muted">
                Anything else? Read the{" "}
                <button type="button" onClick={() => navigate("privacy")} className="u-link font-medium text-brand">
                  privacy policy
                </button>{" "}
                or write to us — details are at the bottom of that page.
              </p>
            </Reveal>
          </div>
          <Reveal delay={100}>
            <div className="divide-y divide-line rounded-2xl border border-line bg-card px-6 sm:px-8">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-[16px] font-normal text-muted transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-[14.5px] leading-7 text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ——— Closing CTA ——— */}
      <section id="download" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-night px-6 py-14 text-center sm:px-12 lg:py-20">
              <div
                aria-hidden="true"
                className="ruled pointer-events-none absolute inset-0 opacity-40"
              />
              <div className="relative">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#a9b8e8]">
                  Start tonight
                </p>
                <h2 className="mx-auto mt-4 max-w-xl font-serif text-[clamp(1.8rem,4.4vw,2.7rem)] font-semibold leading-[1.15] tracking-tight text-white">
                  Your next study set takes five minutes to build.
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-7 text-[#c3cde9]">
                  Name a subject, add the files you already have, and ask your
                  first question. Bring one PDF — leave with a summary and a
                  deck.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href="https://play.google.com/store"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-left transition-colors hover:bg-[#e8ecf7]"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                      <path fill="#1d4ed8" d="M6 4.5v15c0 .8.9 1.3 1.6.9l12-7.5c.6-.4.6-1.4 0-1.8l-12-7.5C6.9 3.2 6 3.7 6 4.5Z" />
                    </svg>
                    <span>
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-muted">
                        Get it on
                      </span>
                      <span className="block text-[16px] font-bold leading-tight text-ink">
                        Google Play
                      </span>
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => goToSection("how")}
                    className="rounded-xl border border-white/25 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
                  >
                    Review how it works
                  </button>
                </div>
                <p className="mt-6 text-[13px] text-[#8e9cc4]">
                  Free to start · Android · Your data stays exportable and deletable
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
