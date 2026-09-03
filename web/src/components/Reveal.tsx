import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "ol" | "ul" | "figure" | "blockquote";
  className?: string;
};

/** Subtle once-only reveal on scroll. Content remains readable if JS motion is off. */
export function Reveal({ children, delay = 0, as = "div", className }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag
      // ref works for all chosen tags since they resolve to div-compatible elements
      ref={ref as never}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      className={className ? `reveal ${className}` : "reveal"}
    >
      {children}
    </Tag>
  );
}
