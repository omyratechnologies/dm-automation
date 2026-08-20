import { ImageResponse } from "next/og";
import { SignalMark } from "@/components/global/gemai-logo/signal-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SignalMark size={31} idPrefix="favicon" />
      </div>
    ),
    size,
  );
}
