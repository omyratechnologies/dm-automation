import { cn } from "@/lib/utils";
import Image from "next/image";

export type GemaiLogoVariant = "full" | "icon" | "text";
export type GemaiLogoSize = "sm" | "md" | "lg" | "xl";

interface GemaiLogoProps {
  variant?: GemaiLogoVariant;
  size?: GemaiLogoSize;
  className?: string;
}

const SIZE_MAP: Record<GemaiLogoSize, number> = { sm: 24, md: 32, lg: 48, xl: 64 };

export function GemaiMark({ size = 32, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <Image
      src="/brand/gemai-mark.svg"
      width={size}
      height={size}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      unoptimized
      className={cn(
        "shrink-0 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:rotate-[3deg] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:rotate-0",
        className,
      )}
    />
  );
}

export default function GemaiLogo({ variant = "full", size = "md", className }: GemaiLogoProps) {
  const pixels = SIZE_MAP[size];
  const showMark = variant !== "text";
  const showWordmark = variant !== "icon";

  return (
    <span
      className={cn("group inline-flex shrink-0 items-center text-foreground", className)}
      style={{ minHeight: pixels }}
      role="img"
      aria-label="Gemai"
    >
      {showMark && <GemaiMark size={pixels} />}
      {showWordmark && (
        <span
          className={cn("inline-flex items-end font-extrabold leading-none tracking-[-0.055em]", showMark && "ml-[0.3em]")}
          style={{ fontSize: Math.round(pixels * 0.68) }}
          aria-hidden="true"
        >
          <span>Gema</span>
          <span className="relative ml-[0.06em] inline-block h-[0.74em] w-[0.17em] rounded-full bg-current">
            <span className="absolute -top-[0.29em] left-1/2 size-[0.22em] -translate-x-1/2 rotate-45 rounded-[0.04em] bg-gradient-to-br from-[#6374ff] to-[#a855f7] transition-transform duration-200 ease-out group-hover:rotate-[135deg] motion-reduce:transition-none motion-reduce:group-hover:rotate-45" />
          </span>
        </span>
      )}
    </span>
  );
}

export function GemaiIcon({ size = "md", className }: Omit<GemaiLogoProps, "variant">) {
  return <GemaiLogo variant="icon" size={size} className={className} />;
}

/** @deprecated Use GemaiMark for the canonical icon. */
export function GemaiIconSVG({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <GemaiMark size={size} className={className} />;
}
