import { ImageResponse } from "next/og";

export const alt = "RunX — See how your code actually runs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social-share card: the RunX wordmark on the brand's midnight base, with the tagline. */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080b17",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 160,
            fontWeight: 600,
            letterSpacing: -4,
            color: "#d1e4fa",
          }}
        >
          Run<span style={{ color: "#9b8cf7" }}>X</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 32,
            color: "#9da7ba",
          }}
        >
          See how your code actually runs
        </div>
      </div>
    ),
    size
  );
}
