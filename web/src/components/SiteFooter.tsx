import { goToSection, navigate } from "../router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-6 text-muted">
              A focused study space built from your own materials — PDFs,
              notes, and links, with answers that cite their sources.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
              Product
            </p>
            <ul className="mt-4 space-y-2.5 text-[14px] font-medium text-ink-soft">
              <li>
                <button type="button" onClick={() => goToSection("why")} className="transition-colors hover:text-brand">
                  Why Stubady
                </button>
              </li>
              <li>
                <button type="button" onClick={() => goToSection("tools")} className="transition-colors hover:text-brand">
                  Study tools
                </button>
              </li>
              <li>
                <button type="button" onClick={() => goToSection("how")} className="transition-colors hover:text-brand">
                  How it works
                </button>
              </li>
              <li>
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-brand"
                >
                  Get the app
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Trust">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
              Trust
            </p>
            <ul className="mt-4 space-y-2.5 text-[14px] font-medium text-ink-soft">
              <li>
                <button type="button" onClick={() => navigate("privacy")} className="transition-colors hover:text-brand">
                  Privacy policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate("delete-account")} className="transition-colors hover:text-brand">
                  Delete your account
                </button>
              </li>
            </ul>
          </nav>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
              Study principle
            </p>
            <p className="mt-4 text-[16px] font-semibold leading-7 tracking-tight text-ink-soft">
              “Answers mean more when you know exactly which page they came
              from.”
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-[13px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Stubady. Made for focused revision.</p>
          <p>Your materials stay yours — export or delete them any time.</p>
        </div>
      </div>
    </footer>
  );
}
