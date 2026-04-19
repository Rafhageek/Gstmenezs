import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a1628",
          border: "6px solid #c9a961",
          borderRadius: 32,
        }}
      >
        <div
          style={{
            fontSize: 120,
            color: "#c9a961",
            fontWeight: 700,
            fontFamily: "monospace",
            letterSpacing: -6,
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size },
  );
}
