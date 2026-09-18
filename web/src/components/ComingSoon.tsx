/**
 * The single honest install state. Stubady has no store listing yet, so
 * every install CTA renders this status chip instead of a store badge
 * that would promise what it cannot do.
 */
export function ComingSoon({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-line bg-card text-ink-soft ${
        large ? "px-5 py-3 text-[14px] font-semibold" : "px-4 py-2.5 text-[14px] font-semibold"
      }`}
      role="status"
      aria-label="Stubady is coming soon on Google Play"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
      Coming soon on Google Play
    </span>
  );
}
