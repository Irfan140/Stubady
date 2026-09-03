import { Reveal } from "../components/Reveal";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "collect", label: "Data we collect" },
  { id: "use", label: "How we use it" },
  { id: "processors", label: "Processors & sharing" },
  { id: "retention", label: "Retention & deletion" },
  { id: "rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

function H2({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 font-serif text-[24px] font-semibold tracking-tight text-ink"
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3.5 text-[15.5px] leading-[1.85] text-ink-soft">{children}</p>;
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-3.5 space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15.5px] leading-[1.8] text-ink-soft">
          <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Privacy() {
  return (
    <main className="bg-card">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
            Privacy policy
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-[clamp(1.9rem,4.4vw,2.8rem)] font-semibold leading-[1.12] tracking-tight text-ink">
            Your study materials are yours. Here’s exactly how we treat them.
          </h1>
          <p className="mt-4 text-[14px] text-faint">
            Last updated: 1 September 2026 · Applies to the Stubady Android app and this website
          </p>
        </Reveal>

        <div className="mt-10 grid gap-12 lg:grid-cols-[230px_1fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="Privacy contents" className="rounded-xl border border-line bg-paper p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
                On this page
              </p>
              <ol className="mt-3 space-y-1">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#/privacy`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="u-link block py-1 text-[13.5px] font-medium text-ink-soft"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>

          <article className="max-w-[68ch]">
            <Reveal>
              <H2 id="overview">Overview</H2>
              <P>
                Stubady is a study companion: you create study sets, add your
                own sources (PDFs, notes, web links), and we help you chat with,
                summarise, and build flashcards from that material. This policy
                explains what data that involves, why we need it, and what
                control you have.
              </P>
              <P>
                The short version: we process your account details and the study
                materials you choose to upload so the app can function. We don’t
                sell your data, we don’t advertise against it, and you can
                delete it at any time.
              </P>
            </Reveal>

            <Reveal>
              <div className="mt-10">
                <H2 id="collect">Data we collect</H2>
                <P>We collect only what the product needs to work:</P>
                <List
                  items={[
                    <>
                      <strong className="font-semibold text-ink">Account details.</strong>{" "}
                      Name, email address, and authentication identifiers handled through our sign-in
                      provider (Clerk) so you can log in securely.
                    </>,
                    <>
                      <strong className="font-semibold text-ink">Study materials you provide.</strong>{" "}
                      PDFs you upload, notes you type or paste, and web links you add — plus the
                      titles and organisation (study sets) you give them.
                    </>,
                    <>
                      <strong className="font-semibold text-ink">Content you generate.</strong>{" "}
                      Chat conversations, summaries, and flashcard decks created from your sources,
                      stored so you can revisit them.
                    </>,
                    <>
                      <strong className="font-semibold text-ink">Technical & usage data.</strong>{" "}
                      Device type, app version, error logs, and coarse usage events (for example,
                      that a summary was generated) used to keep the service reliable.
                    </>,
                  ]}
                />
                <P>
                  We don’t ask for contacts, location, or anything outside the
                  study workflow, and there’s no advertising SDK in the app.
                </P>
              </div>
            </Reveal>

            <Reveal>
              <div className="mt-10">
                <H2 id="use">How we use it</H2>
                <List
                  items={[
                    "To operate the service: storing your sets and sources, processing them for search, and generating chats, summaries, and flashcards.",
                    "To keep you signed in and your library synced across sessions.",
                    "To maintain reliability and safety: debugging errors, preventing abuse, and enforcing fair-use limits.",
                    "To improve the product in aggregate — for example, noticing that PDF processing fails often and fixing it. We don’t train shared models on your materials.",
                  ]}
                />
              </div>
            </Reveal>

            <Reveal>
              <div className="mt-10">
                <H2 id="processors">Processors & sharing</H2>
                <P>
                  We don’t sell personal data to anyone. Limited data is shared
                  with infrastructure providers strictly so the app can run:
                </P>
                <List
                  items={[
                    <>
                      <strong className="font-semibold text-ink">Authentication</strong> — Clerk
                      (sign-in, session management).
                    </>,
                    <>
                      <strong className="font-semibold text-ink">Hosting & storage</strong> — managed
                      database and encrypted file storage for your account, sets, sources, and
                      generated content.
                    </>,
                    <>
                      <strong className="font-semibold text-ink">AI processing</strong> — OpenAI via
                      our backend to produce answers, summaries, and flashcards from the sources you
                      select. Your materials are sent for processing, not for training shared models.
                    </>,
                    <>
                      <strong className="font-semibold text-ink">Web retrieval</strong> — Firecrawl to
                      fetch the public web pages you explicitly add as sources.
                    </>,
                  ]}
                />
                <P>
                  We’ll also disclose data if the law requires it, or to protect
                  the safety and integrity of the service.
                </P>
              </div>
            </Reveal>

            <Reveal>
              <div className="mt-10">
                <H2 id="retention">Retention & deletion</H2>
                <P>
                  Your content is kept for as long as your account is active so
                  your library, history, and decks persist between sessions.
                </P>
                <List
                  items={[
                    "Deleting a source removes it and its processed data from that study set.",
                    "Deleting a study set removes the set, its sources, and everything generated from them.",
                    "Deleting your account removes your profile, sets, sources, conversations, summaries, and decks. Backups expire within 30 days.",
                  ]}
                />
                <P>
                  You can delete individual items inside the app at any time, or
                  request full account deletion from the delete-account page.
                  Account deletion requests are completed within 30 days and
                  confirmed by email.
                </P>
              </div>
            </Reveal>

            <Reveal>
              <div className="mt-10">
                <H2 id="rights">Your rights</H2>
                <P>
                  Depending on where you live, you may have the right to access,
                  correct, export, restrict, or delete your personal data, and
                  to object to certain processing. To exercise any of these,
                  contact us at the address below — we respond to every request
                  and complete deletion requests within 30 days.
                </P>
              </div>
            </Reveal>

            <Reveal>
              <div className="mt-10">
                <H2 id="children">Children</H2>
                <P>
                  Stubady is intended for students aged 16 and older (or the
                  minimum age for consent in your country, if higher). We don’t
                  knowingly collect data from younger children; if you believe a
                  child has created an account, contact us and we’ll remove it
                  promptly.
                </P>
              </div>
            </Reveal>

            <Reveal>
              <div className="mt-10">
                <H2 id="changes">Changes</H2>
                <P>
                  If this policy changes in a way that affects you, we’ll
                  update the date above and — for material changes — notify you
                  in the app or by email before the new version takes effect.
                </P>
              </div>
            </Reveal>

            <Reveal>
              <div className="mt-10 rounded-xl border border-line bg-paper p-6">
                <H2 id="contact">Contact</H2>
                <P>
                  Questions about privacy, or a rights request? Write to us at{" "}
                  <a href="mailto:support@stubady.app" className="u-link font-medium text-brand">
                    support@stubady.app
                  </a>
                  . Please include the email address you signed up with so we
                  can locate your account.
                </P>
              </div>
            </Reveal>
          </article>
        </div>
      </div>
    </main>
  );
}
