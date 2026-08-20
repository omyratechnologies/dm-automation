import { cn } from "@/lib/utils";
import { useId } from "react";
import { SignalMark } from "./signal-mark";

export type GemaiLogoVariant = "full" | "icon" | "text";
export type GemaiLogoSize = "sm" | "md" | "lg" | "xl";

interface GemaiLogoProps {
  variant?: GemaiLogoVariant;
  size?: GemaiLogoSize;
  className?: string;
}

const SIZE_MAP: Record<GemaiLogoSize, number> = { sm: 24, md: 32, lg: 48, xl: 64 };

export function GemaiMark({ size = 32, className, title }: { size?: number; className?: string; title?: string }) {
  const idPrefix = `gemai-${useId().replace(/:/g, "")}`;
  return <SignalMark size={size} className={className} title={title} idPrefix={idPrefix} />;
}

export default function GemaiLogo({ variant = "full", size = "md", className }: GemaiLogoProps) {
  const pixels = SIZE_MAP[size];
  const showMark = variant !== "text";
  const showWordmark = variant !== "icon";

  return (
    <span
      className={cn("inline-flex shrink-0 items-center text-foreground", className)}
      style={{ minHeight: pixels }}
      aria-label="Gemai"
    >
      {showMark && <GemaiMark size={pixels} />}
      {showWordmark && (
        <span
          className={cn("font-extrabold leading-none tracking-[-0.055em]", showMark && "ml-[0.28em]")}
          style={{ fontSize: Math.round(pixels * 0.68) }}
          aria-hidden="true"
        >
          Gemai
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
