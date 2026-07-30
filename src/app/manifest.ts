import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RunX",
    short_name: "RunX",
    description: "An AI-powered code-execution, DSA, and complexity visualizer for students.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0b0b16",
    theme_color: "#0b0b16",
    icons: [],
  };
}
