import type { SVGProps } from "react";

function Base({ children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3.5 5.5h13v8h-7l-3.5 3v-3H3.5v-8Z" />
      <path d="M6.5 8.5h7M6.5 11h4.5" />
    </Base>
  );
}

export function SummaryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M5 3.5h7l3.5 3.5v9.5h-10.5v-13Z" />
      <path d="M12 3.5V7h3.5M7.5 10.5h5M7.5 13h5M7.5 15.5h3" />
    </Base>
  );
}

export function CardsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="6" y="6" width="10.5" height="10.5" rx="1.8" />
      <path d="M13.5 6V5a1.8 1.8 0 0 0-1.8-1.8H5A1.8 1.8 0 0 0 3.2 5v6.7a1.8 1.8 0 0 0 1.8 1.8h1" />
    </Base>
  );
}

export function LibraryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3.5 4.5A1.5 1.5 0 0 1 5 3h9.5A1.5 1.5 0 0 1 16 4.5V17l-2.6-1.8L10.8 17l-2.6-1.8L5.6 17 3.5 15.6V4.5Z" />
      <path d="M3.5 15.6 5.6 17l2.6-1.8L10.8 17l2.6-1.8L16 17" />
    </Base>
  );
}

export function SourceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M8 11.5a3.5 3.5 0 0 1 5 0l2 2a3.54 3.54 0 0 1-5 5l-1-1" />
      <path d="M12 8.5a3.5 3.5 0 0 1-5 0l-2-2a3.54 3.54 0 0 1 5-5l1 1" />
    </Base>
  );
}

export function PdfIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M5 3.5h7l3.5 3.5V16.5h-10.5v-13Z" />
      <path d="M12 3.5V7h3.5" />
    </Base>
  );
}

export function NoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M13.5 3.5H5v13h10.5v-13Z" />
      <path d="M7.5 7h5M7.5 9.8h5M7.5 12.6h3" />
    </Base>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="m4 10.5 3.5 3.5L16 5.5" />
    </Base>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M10 2.8 4.5 5v5.2c0 3.4 2.3 5.9 5.5 7 3.2-1.1 5.5-3.6 5.5-7V5L10 2.8Z" />
      <path d="m7.5 10 1.8 1.8 3.2-3.6" />
    </Base>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3.5 10h13M13 5.5 17.5 10 13 14.5" />
    </Base>
  );
}

export function QuoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 12.5c0-3.5 2-6 5-7l.6 1.2C7.4 7.6 6.3 9 6.1 10.5H8.5V14H4v-1.5ZM11.5 12.5c0-3.5 2-6 5-7l.6 1.2c-2.2.9-3.3 2.3-3.5 3.8H16V14h-4.5v-1.5Z" />
    </Base>
  );
}
