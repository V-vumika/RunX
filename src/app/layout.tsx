import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// AuthKit-style type system: Space Grotesk carries the display wordmark and big
// headings, Inter does all the working UI and body copy, JetBrains Mono handles
// the dot-tracked eyebrow labels and code.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Resolves relative OG/Twitter image URLs; falls back to localhost until
  // NEXT_PUBLIC_SITE_URL is set to the deployed domain.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "RunX · See how your code actually runs",
    template: "%s · RunX",
  },
  description:
    "Run code step by step in your browser — watch every line, variable, data structure and the measured complexity animate as it executes. Python & JavaScript today, Java & C++ coming. Built for students.",
  keywords: [
    "code visualizer",
    "algorithm visualizer",
    "data structure visualizer",
    "code execution",
    "Big O complexity",
    "Python visualizer",
    "JavaScript visualizer",
    "DSA",
    "learn to code",
  ],
  applicationName: "RunX",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "RunX · See how your code actually runs",
    description:
      "Watch code execute line by line — variables, data structures, the call stack and complexity, drawn as it happens. Runs in your browser.",
    siteName: "RunX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RunX · See how your code actually runs",
    description:
      "Watch code execute line by line — variables, data structures and complexity, drawn as it happens. Runs in your browser.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
