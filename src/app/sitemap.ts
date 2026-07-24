import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/app`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/app/interview`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
