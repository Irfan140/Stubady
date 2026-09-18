import { useEffect, useState } from "react";
import { goToSection, navigate, type Route } from "../router";
import { ComingSoon } from "./ComingSoon";
import { Logo } from "./Logo";

const SECTION_LINKS = [
  { label: "Why Stubady", target: "why" },
  { label: "Study tools", target: "tools" },
  { label: "How it works", target: "how" },
  { label: "Your data", target: "data" },
  { label: "Architecture", target: "architecture" },
];

export function SiteHeader({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open ]);

  const goSection = (id: string) => {
    setOpen(false);
    goToSection(id);
  };

  const goRoute = (next: Route) => {
    setOpen(false);
    navigate(next);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl transition-shadow ${
        scrolled ? "border-line shadow-[0_1px_12px_rgba(15,23,42,0.06)]" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <button
          type="button"
          onClick={() => goRoute("home")}
          className="rounded-md"
          aria-label="Stubady home"
        >
          <Logo />
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {SECTION_LINKS.map((link) => (
            <button
              key={link.target}
              type="button"
              onClick={() => goSection(link.target)}
              className="rounded-full px-3 py-2 text-[14px] font-medium text-ink-soft transition-colors hover:bg-slate-100 hover:text-ink"
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goRoute("privacy")}
            aria-current={route === "privacy" ? "page" : undefined}
            className={`rounded-full px-3 py-2 text-[14px] font-medium transition-colors hover:bg-slate-100 hover:text-ink ${
              route === "privacy" ? "text-brand" : "text-ink-soft"
            }`}
          >
            Privacy
          </button>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ComingSoon />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink shadow-sm md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
            </svg>
          )}
        </button>
      </div>

      {open ? (
        <nav
          className="border-t border-line bg-white px-5 pb-6 pt-3 md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col">
            {SECTION_LINKS.map((link) => (
              <li key={link.target} className="border-b border-line-soft">
                <button
                  type="button"
                  onClick={() => goSection(link.target)}
                  className="flex w-full items-center justify-between py-3.5 text-left text-[16px] font-medium text-ink"
                >
                  {link.label}
                  <span aria-hidden="true" className="text-faint">→</span>
                </button>
              </li>
            ))}
            <li className="border-b border-line-soft">
              <button
                type="button"
                onClick={() => goRoute("privacy")}
                className="flex w-full items-center justify-between py-3.5 text-left text-[16px] font-medium text-ink"
              >
                Privacy policy
                <span aria-hidden="true" className="text-faint">→</span>
              </button>
            </li>
            <li className="border-b border-line-soft">
              <button
                type="button"
                onClick={() => goRoute("delete-account")}
                className="flex w-full items-center justify-between py-3.5 text-left text-[16px] font-medium text-ink"
              >
                Delete account
                <span aria-hidden="true" className="text-faint">→</span>
              </button>
            </li>
          </ul>
          <div className="mt-5 flex w-full justify-center">
            <ComingSoon />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
