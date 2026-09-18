import { Reveal } from "../components/Reveal";
import { navigate } from "../router";

export function NotFound() {
  return (
    <main className="bg-card">
      <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 lg:py-28">
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
            Page not found
          </p>
          <h1 className="mx-auto mt-4 max-w-xl text-[clamp(1.9rem,4.4vw,2.8rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
            This page isn&apos;t in your sources.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-7 text-muted">
            The link you followed doesn&apos;t point anywhere on this site.
            Start from the beginning instead.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("home")}
              className="rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-ink-soft"
            >
              Back to home
            </button>
            <a
              href="#/privacy"
              className="rounded-xl border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-slate-50"
            >
              Privacy policy
            </a>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
