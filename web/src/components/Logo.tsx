import icon from "../assets/icon.png";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <img
          src={icon}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-contain p-[5px]"
        />
      </span>
      <span className="text-[19px] font-bold tracking-tight text-ink">
        Stubady
      </span>
    </span>
  );
}
