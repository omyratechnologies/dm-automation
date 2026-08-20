import { ImageResponse } from "next/og";
import { SignalMark } from "@/components/global/gemai-logo/signal-mark";

export const alt = "Gemai - AI-Powered Instagram DM Automation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          background: "#070912",
          color: "#F8FAFC",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 15% 15%, rgba(91,106,240,.28), transparent 38%), radial-gradient(circle at 88% 82%, rgba(139,92,246,.24), transparent 40%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 24,
            display: "flex",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 36,
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            padding: "74px 86px",
            gap: 72,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 210,
              height: 210,
              borderRadius: 48,
              background: "rgba(255,255,255,.045)",
              border: "1px solid rgba(255,255,255,.10)",
            }}
          >
            <SignalMark size={150} idPrefix="open-graph" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 730 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                color: "#AEB6D9",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              AI conversation automation
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 76,
                fontWeight: 800,
                letterSpacing: -4,
                lineHeight: 1,
                marginBottom: 24,
              }}
            >
              Gemai
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 34,
                color: "#B7BED4",
                lineHeight: 1.35,
                maxWidth: 690,
              }}
            >
              Turn Instagram conversations into customers — automatically.
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
              {["DMs", "Comments", "AI replies"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    padding: "10px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.12)",
                    color: "#D8DCF0",
                    fontSize: 18,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
