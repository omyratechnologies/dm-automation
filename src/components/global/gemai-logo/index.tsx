"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useState, useEffect } from "react";

interface GemaiLogoProps {
  variant?: "full" | "icon" | "text";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Gemai Logo Component
 * 
 * Variants:
 * - full: Complete logo with icon and text (default)
 * - icon: Just the G icon
 * - text: Just the GEMAI text
 * 
 * Sizes:
 * - sm: Small (24px height)
 * - md: Medium (32px height) - default
 * - lg: Large (48px height)
 * - xl: Extra large (64px height)
 * 
 * Automatically adapts to light/dark theme
 */
export default function GemaiLogo({
  variant = "full",
  size = "md",
  className = "",
}: GemaiLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by showing placeholder during SSR
  if (!mounted) {
    return (
      <div
        className={`bg-muted rounded-lg animate-pulse ${className}`}
        style={{
          width: variant === "icon" ? getSizePixels(size) : getSizePixels(size) * 4,
          height: getSizePixels(size),
        }}
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const logoSrc = isDark
    ? "/Gemai-logo-white-transperant.png"
    : "/Gemai-logo-transperant.png";

  const dimensions = getDimensions(variant, size);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={logoSrc}
        alt="Gemai - AI-Powered Instagram Automation"
        width={dimensions.width}
        height={dimensions.height}
        priority
        className="object-contain"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      />
    </div>
  );
}

/**
 * Icon-only version of the logo (just the G)
 */
export function GemaiIcon({
  size = "md",
  className = "",
}: Omit<GemaiLogoProps, "variant">) {
  return <GemaiLogo variant="icon" size={size} className={className} />;
}

/**
 * Simple SVG version of the G icon for better performance
 */
export function GemaiIconSVG({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg bg-gradient-brand flex items-center justify-center font-bold text-white shadow-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.6 }}>G</span>
    </div>
  );
}

// Helper functions
function getSizePixels(size: string): number {
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
  };
  return sizeMap[size as keyof typeof sizeMap] || 32;
}

function getDimensions(
  variant: string,
  size: string
): { width: number; height: number } {
  const baseHeight = getSizePixels(size);

  switch (variant) {
    case "icon":
      return { width: baseHeight, height: baseHeight };
    case "text":
      return { width: baseHeight * 3.5, height: baseHeight };
    case "full":
    default:
      // Full logo aspect ratio is approximately 4:1
      return { width: baseHeight * 4, height: baseHeight };
  }
}
