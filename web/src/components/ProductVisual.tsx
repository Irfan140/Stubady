import { CardsIcon, ChatIcon, SummaryIcon } from "./icons";

/**
 * Stylised but faithful rendition of a Stubady study set —
 * built from the real app states (queued / processing / ready,
 * grounded chat with citations, summary preview, flashcard deck).
 */
export function ProductVisual() {
  return (
    <figure className="relative">
      <div
        className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_24px_60px_-28px_rgba(22,33,58,0.35)]"
        role="img"
        aria-label="Illustration of the Stubady app showing a Biology study set with sources, a cited answer, and flashcards"
      >
        {/* Window bar */}
        <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3 sm:px-5">
          <span className="flex gap-1.5" aria-hidden="true">
            <i className="h-2.5 w-2.5 rounded-full bg-line" />
            <i className="h-2.5 w-2.5 rounded-full bg-line" />
            <i className="h-2.5 w-2.5 rounded-full bg-line" />
          </span>
          <p className="truncate text-[13px] font-semibold text-ink">
            Biology 101 <span className="font-normal text-faint">· Cell division</span>
          </p>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-moss-tint px-2.5 py-1 text-[11px] font-semibold text-moss sm:inline-flex">
            <i className="h-1.5 w-1.5 rounded-full bg-moss" aria-hidden="true" />
            3 sources ready
          </span>
        </div>

        <div className="grid md:grid-cols-[220px_1fr]">
          {/* Sources rail */}
          <div className="border-b border-line-soft bg-paper/60 p-4 sm:p-5 md:border-b-0 md:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
              Sources
            </p>
            <ul className="mt-3 space-y-2.5">
              <li className="rounded-lg border border-line-soft bg-card p-2.5">
                <p className="text-[12px] font-semibold text-ink">lecture-notes.pdf</p>
                <p className="mt-0.5 text-[11px] text-faint">12 pages · PDF</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-moss-tint px-2 py-0.5 text-[11px] font-semibold text-moss">
                  <i className="h-1.5 w-1.5 rounded-full bg-moss" aria-hidden="true" />
                  Ready
                </span>
              </li>
              <li className="rounded-lg border border-line-soft bg-card p-2.5">
                <p className="text-[12px] font-semibold text-ink">Mitosis stages</p>
                <p className="mt-0.5 text-[11px] text-faint">Typed note</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-moss-tint px-2 py-0.5 text-[11px] font-semibold text-moss">
                  <i className="h-1.5 w-1.5 rounded-full bg-moss" aria-hidden="true" />
                  Ready
                </span>
              </li>
              <li className="rounded-lg border border-line-soft bg-card p-2.5">
                <p className="text-[12px] font-semibold text-ink">khanacademy.org/…/mitosis</p>
                <p className="mt-0.5 text-[11px] text-faint">Web page</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-semibold text-brand">
                  <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" aria-hidden="true" />
                  Processing
                </span>
              </li>
            </ul>
          </div>

          {/* Chat + tools */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-brand">
              <ChatIcon className="h-4 w-4" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                Ask your materials
              </p>
            </div>
            <div className="mt-3 rounded-xl bg-brand-tint/60 p-3.5">
              <p className="text-[13.5px] font-medium leading-6 text-ink">
                What happens during prophase?
              </p>
            </div>
            <div className="mt-2.5 rounded-xl border border-line-soft bg-card p-3.5">
              <p className="text-[13.5px] leading-6 text-ink-soft">
                Chromatin condenses into visible chromosomes, the nuclear
                envelope breaks down, and spindle fibres begin to form.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-md border border-line bg-paper px-2 py-1 text-[11px] font-medium text-muted">
                  lecture-notes.pdf · p. 4
                </span>
                <span className="rounded-md border border-line bg-paper px-2 py-1 text-[11px] font-medium text-muted">
                  Mitosis stages · §2
                </span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-line-soft px-3.5 py-3">
              <p className="caret text-[13px] text-faint">Ask about your notes…</p>
              <span className="ml-auto rounded-md bg-brand px-2.5 py-1.5 text-[12px] font-semibold text-white">
                Send
              </span>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 rounded-xl border border-line-soft p-3">
                <SummaryIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
                <div>
                  <p className="text-[12.5px] font-semibold text-ink">Summary ready</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-muted">
                    “Cell division in four stages…”
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-line-soft p-3">
                <CardsIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-[12.5px] font-semibold text-ink">Deck · 18 cards</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-muted">
                    Q: Which stage follows metaphase?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[12.5px] text-faint">
        The Stubady study-set view — sources, cited answers, summaries, and
        flashcards in one place. Illustrative preview.
      </figcaption>
    </figure>
  );
}
