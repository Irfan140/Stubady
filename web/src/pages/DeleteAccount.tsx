import { useState, type FormEvent } from "react";
import { Reveal } from "../components/Reveal";
import { CheckIcon } from "../components/icons";
import { navigate } from "../router";

const DELETED_ITEMS = [
  "Your profile and sign-in identity",
  "All study sets, with their sources and files",
  "Conversations, summaries, and flashcard decks",
  "Usage history tied to your account",
];

const IN_APP_STEPS = [
  "Open Stubady and go to Settings.",
  "Choose Edit profile or account settings.",
  "Select Delete account and confirm.",
];

type Errors = { email?: string; confirm?: string };

export function DeleteAccount() {
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter the email address you signed up with.";
    }
    if (confirm.trim().toUpperCase() !== "DELETE") {
      next.confirm = 'Type DELETE in the box to confirm.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const subject = encodeURIComponent("Stubady account deletion request");
    const body = encodeURIComponent(
      `Hello Stubady team,\n\nPlease delete my Stubady account and all associated data.\n\nAccount email: ${email.trim()}\n${reason ? `Reason for leaving (optional): ${reason}\n` : ""}\nI understand this permanently removes my study sets, sources, chats, summaries, and flashcards.\n\nThank you.`,
    );
    window.location.href = `mailto:irfanmehmud140@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <main className="bg-card">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
            Account deletion
          </p>
          <h1 className="mt-4 max-w-2xl text-[clamp(1.9rem,4.4vw,2.8rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
            Delete your Stubady account.
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted">
            Sorry to see you go. Deletion is permanent and removes everything
            listed below. To request deletion, email us at{" "}
            <a href="mailto:irfanmehmud140@gmail.com" className="u-link font-medium text-brand">
              irfanmehmud140@gmail.com
            </a>{" "}
            or use the form below. Requests are completed within 30 days and
            confirmed by email.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Left: what happens */}
          <div>
            <Reveal>
              <section aria-label="What gets deleted" className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
                <h2 className="text-[16px] font-semibold tracking-tight text-ink">
                  What gets deleted
                </h2>
                <ul className="mt-4 space-y-3">
                  {DELETED_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14.5px] leading-6 text-ink-soft">
                      <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-moss" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-line-soft pt-4 text-[13.5px] leading-6 text-faint">
                  Backups holding deleted data expire automatically within 30
                  days. We keep nothing usable after that point.
                </p>
              </section>
            </Reveal>

            <Reveal delay={90}>
              <section aria-label="Alternatives" className="mt-6 rounded-2xl border border-line bg-paper p-6 sm:p-7">
                <h2 className="text-[16px] font-semibold tracking-tight text-ink">
                  Only need a fresh start?
                </h2>
                <p className="mt-2 text-[14.5px] leading-7 text-muted">
                  You don’t have to delete your account to tidy up. Inside the
                  app you can delete a single source or study set instead:
                </p>
                <ol className="mt-4 space-y-2.5">
                  {IN_APP_STEPS.map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-[14.5px] leading-6 text-ink-soft">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream text-[12px] font-bold text-ink">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="mt-5 border-t border-line-soft pt-4 text-[13.5px] leading-6 text-muted">
                  Prefer to keep your data but have a concern? Read the{" "}
                  <button type="button" onClick={() => navigate("privacy")} className="u-link font-medium text-brand">
                    privacy policy
                  </button>{" "}
                  or email{" "}
                  <a href="mailto:irfanmehmud140@gmail.com" className="u-link font-medium text-brand">
                    irfanmehmud140@gmail.com
                  </a>
                  .
                </p>
              </section>
            </Reveal>
          </div>

          {/* Right: request form */}
          <Reveal delay={140}>
            <section
              aria-label="Request account deletion"
              className="rounded-2xl border border-line bg-paper p-6 sm:p-8 lg:sticky lg:top-24"
            >
              {sent ? (
                <div role="status" className="py-4 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-moss-tint">
                    <CheckIcon className="h-6 w-6 text-moss" />
                  </span>
                  <h2 className="mt-4 text-[24px] font-bold tracking-tight text-ink">
                    Request composed.
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-7 text-muted">
                    Your email app should have opened with a pre-filled deletion
                    request for <strong className="font-semibold text-ink">{email.trim()}</strong>.
                    Just press send — we’ll confirm once your account is gone,
                    within 30 days.
                  </p>
                  <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-6 text-faint">
                    No email app opened? Send the same details manually to{" "}
                    <a href="mailto:irfanmehmud140@gmail.com" className="u-link font-medium text-brand">
                      irfanmehmud140@gmail.com
                    </a>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setConfirm("");
                    }}
                    className="mt-6 rounded-lg border border-line bg-card px-5 py-3 text-[14px] font-semibold text-ink transition-colors hover:border-ink/30"
                  >
                    Make another request
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h2 className="text-[18px] font-semibold tracking-tight text-ink">
                    Request deletion by email
                  </h2>
                  <p className="mt-2 text-[14px] leading-6 text-muted">
                    This composes an email to{" "}
                    <a href="mailto:irfanmehmud140@gmail.com" className="u-link font-medium text-brand">
                      irfanmehmud140@gmail.com
                    </a>{" "}
                    from your own inbox — nothing is sent until you press send
                    there.
                  </p>

                  <div className="mt-6">
                    <label htmlFor="del-email" className="block text-[14px] font-semibold text-ink">
                      Account email
                    </label>
                    <input
                      id="del-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "del-email-error" : undefined}
                      className={`mt-2 w-full rounded-lg border bg-card px-4 py-3.5 text-[15px] text-ink placeholder:text-faint ${
                        errors.email ? "border-red-500" : "border-line"
                      }`}
                    />
                    {errors.email ? (
                      <p id="del-email-error" role="alert" className="mt-2 text-[13.5px] font-medium text-red-700">
                        {errors.email}
                      </p>
                    ) : (
                      <p className="mt-2 text-[13px] text-faint">
                        Must match the address you signed up with.
                      </p>
                    )}
                  </div>

                  <div className="mt-5">
                    <label htmlFor="del-reason" className="block text-[14px] font-semibold text-ink">
                      Reason for leaving{" "}
                      <span className="font-normal text-faint">(optional)</span>
                    </label>
                    <select
                      id="del-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-2 w-full appearance-none rounded-lg border border-line bg-card px-4 py-3.5 text-[15px] text-ink"
                    >
                      <option value="">Choose one…</option>
                      <option value="finished-studying">Finished my course or exams</option>
                      <option value="missing-feature">Missing a feature I need</option>
                      <option value="too-complex">Too complex for my workflow</option>
                      <option value="privacy">Privacy or data concerns</option>
                      <option value="other">Something else</option>
                    </select>
                  </div>

                  <div className="mt-5">
                    <label htmlFor="del-confirm" className="block text-[14px] font-semibold text-ink">
                      Type <span className="rounded bg-cream px-1.5 py-0.5 font-mono text-[13px]">DELETE</span> to confirm
                    </label>
                    <input
                      id="del-confirm"
                      type="text"
                      autoComplete="off"
                      autoCapitalize="characters"
                      placeholder="DELETE"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      aria-invalid={Boolean(errors.confirm)}
                      aria-describedby={errors.confirm ? "del-confirm-error" : undefined}
                      className={`mt-2 w-full rounded-lg border bg-card px-4 py-3.5 text-[15px] tracking-widest text-ink placeholder:text-faint ${
                        errors.confirm ? "border-red-500" : "border-line"
                      }`}
                    />
                    {errors.confirm ? (
                      <p id="del-confirm-error" role="alert" className="mt-2 text-[13.5px] font-medium text-red-700">
                        {errors.confirm}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="mt-7 w-full rounded-lg bg-[#b4232a] px-5 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-[#912018]"
                  >
                    Compose deletion request
                  </button>
                  <p className="mt-4 text-center text-[13px] leading-6 text-faint">
                    Opens your email app with everything pre-filled.
                    <br />
                    Completed within 30 days, confirmed by reply.
                  </p>
                </form>
              )}
            </section>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
