"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  text?: string;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = "md",
  variant = "spinner",
  text,
  className,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (variant === "spinner") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-primary/30 border-t-primary",
            sizeClasses[size]
          )}
        />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-full bg-primary animate-bounce",
              size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
            )}
            style={{ animationDelay: "0ms" }}
          />
          <div
            className={cn(
              "rounded-full bg-primary animate-bounce",
              size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
            )}
            style={{ animationDelay: "150ms" }}
          />
          <div
            className={cn(
              "rounded-full bg-primary animate-bounce",
              size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
            )}
            style={{ animationDelay: "300ms" }}
          />
        </div>
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div
          className={cn(
            "rounded-full bg-primary/30 animate-pulse",
            sizeClasses[size]
          )}
        />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  return null;
};

// Full page loading overlay
export const LoadingOverlay: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="p-8 rounded-2xl bg-card border border-border shadow-xl">
        <LoadingIndicator size="lg" variant="spinner" text={text} />
      </div>
    </div>
  );
};

// Inline loading for buttons
export const ButtonLoader: React.FC = () => {
  return (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
