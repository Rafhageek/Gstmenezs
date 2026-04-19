import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          border: "16px solid #c9a961",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            fontSize: 340,
            color: "#c9a961",
            fontWeight: 700,
            fontFamily: "monospace",
            letterSpacing: -20,
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size },
  );
}
