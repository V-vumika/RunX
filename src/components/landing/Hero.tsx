import { HeroBackdrop } from "./authkit/HeroBackdrop";
import { ParticleField } from "./authkit/ParticleField";
import { Reveal } from "./authkit/Reveal";

/**
 * Hero reverse-engineered from the AuthKit reference: a framed blueprint grid
 * lit by a wide diffused beam, a single luminous gradient wordmark, and a fan of
 * frosted product cards that emerge from behind the content and bleed off the
 * bottom of the frame. The center card is forward and rim-lit; the two behind it
 * recede with scale, blur and opacity. All content stays RunX.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#080b17]">
      <ParticleField />
      <HeroBackdrop />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-32 text-center sm:pt-40">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.02em] text-fog">Now running in your browser</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="ak-skywash mt-8 font-display font-medium leading-[0.85] tracking-[-0.03em] text-[clamp(5rem,17vw,13rem)]">
            RunX
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mx-auto mt-6 max-w-md text-pretty text-lg leading-relaxed text-mist">
            See how your code actually runs — every line, every variable, every step, drawn as it happens.
          </p>
        </Reveal>

        <CardFan />
      </div>
    </section>
  );
}

/**
 * Three cards fanned like the reference: the center one forward, sharp and
 * rim-lit; the two behind it tucked in, dimmer and blurred. The cluster is
 * anchored low and the cards are tall, so the section's clip lets them bleed off
 * the bottom and read as emerging from behind the hero.
 */
function CardFan() {
  return (
    <Reveal
      delay={0.28}
      className="relative mt-14 hidden h-[380px] w-full overflow-hidden md:block [mask-image:linear-gradient(to_bottom,#000_78%,transparent)]"
    >
      <div className="relative mx-auto h-full w-[420px]">
        {/* Shadow pool the cluster sits in. */}
        <div className="absolute left-1/2 top-24 h-40 w-[720px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.6),transparent_70%)] blur-2xl" />

        {/* Left card, tucked behind and receded. */}
        <div className="absolute left-1/2 top-10 w-[360px] -translate-x-[122%] scale-[0.94] opacity-50 blur-[1.5px]">
          <div className="ak-float" style={{ animationDelay: "0.9s" }}>
            <MemoryCard />
          </div>
        </div>

        {/* Right card, mirror. */}
        <div className="absolute left-1/2 top-10 w-[360px] translate-x-[22%] scale-[0.94] opacity-50 blur-[1.5px]">
          <div className="ak-float" style={{ animationDelay: "1.7s" }}>
            <StructureCard />
          </div>
        </div>

        {/* Center card, forward and lit. */}
        <div className="absolute left-1/2 top-0 z-10 w-[420px] -translate-x-1/2">
          <div className="ak-float">
            <StepperCard />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function CardShell({
  title,
  children,
  lit = false,
}: {
  title: string;
  children: React.ReactNode;
  lit?: boolean;
}) {
  return (
    <div className={`ak-glass-deep relative overflow-hidden rounded-2xl ${lit ? "ak-rimlight" : ""}`}>
      {lit && (
        <>
          <CornerDot className="left-2.5 top-2.5" />
          <CornerDot className="right-2.5 top-2.5" />
          <CornerDot className="bottom-2.5 left-2.5" />
          <CornerDot className="bottom-2.5 right-2.5" />
        </>
      )}
      <div className="flex items-center gap-1.5 border-b border-[rgba(186,215,247,0.08)] px-3.5 py-3">
        <span className="size-2 rounded-full bg-[rgba(228,109,76,0.7)]" />
        <span className="size-2 rounded-full bg-[rgba(216,236,248,0.5)]" />
        <span className="size-2 rounded-full bg-[rgba(38,150,132,0.7)]" />
        <span className="ml-2 font-mono text-[10px] text-fog">{title}</span>
      </div>
      {children}
    </div>
  );
}

function CornerDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute z-10 size-1 rounded-full bg-[rgba(186,215,247,0.35)] ${className ?? ""}`}
    />
  );
}

function StepperCard() {
  const lines = [
    "def bubble_sort(a):",
    "  for i in range(len(a)):",
    "    for j in range(len(a)-1-i):",
    "      if a[j] > a[j+1]:",
    "        a[j], a[j+1] = a[j+1], a[j]",
    "  return a",
  ];
  const active = 3;
  return (
    <CardShell title="main.py" lit>
      <div className="py-3.5 font-mono text-[11px] leading-[1.85]">
        {lines.map((ln, i) => (
          <div key={i} className={`flex gap-3 px-4 ${i === active ? "bg-[rgba(250,204,21,0.12)]" : ""}`}>
            <span className="w-3 select-none text-right text-fog/50">{i + 1}</span>
            <span className={i === active ? "text-frost" : "text-fog"}>{ln}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-[rgba(186,215,247,0.08)] px-4 py-3">
        <span className="rounded-full bg-void-violet px-3 py-1 text-[10px] font-medium text-white shadow-[0_0_16px_rgba(102,58,243,0.45)]">
          Run
        </span>
        <span className="font-mono text-[10px] text-fog">step 4 of 42</span>
        <span className="ml-auto font-mono text-[10px] text-[#7fd7c0]">O(n²)</span>
      </div>
    </CardShell>
  );
}

function MemoryCard() {
  return (
    <CardShell title="memory">
      <div className="flex flex-col gap-2 p-4">
        {[
          ["a[j]", "52"],
          ["a[j+1]", "16"],
          ["i", "0"],
          ["j", "2"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-md bg-[rgba(199,211,234,0.05)] px-3 py-2">
            <span className="font-mono text-[10px] text-mist">{k}</span>
            <span className="font-mono text-[11px] font-medium text-frost">{v}</span>
          </div>
        ))}
        <div className="mt-2 flex items-end gap-1.5">
          {[26, 40, 18, 52, 30, 44].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${i === 3 ? "bg-[#efb54a]" : "bg-[rgba(102,58,243,0.6)]"}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function StructureCard() {
  const nodes = [
    { x: 50, y: 20 },
    { x: 26, y: 55 },
    { x: 74, y: 55 },
    { x: 14, y: 90 },
    { x: 86, y: 90 },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
  ];
  return (
    <CardShell title="structure">
      <div className="p-4">
        <svg viewBox="0 0 100 105" className="h-40 w-full">
          {edges.map(([a, b], i) => (
            <line
              key={i}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke="rgba(186,215,247,0.25)"
              strokeWidth={1.2}
            />
          ))}
          {nodes.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r={8} fill="rgba(102,58,243,0.18)" stroke="#9b8cf7" strokeWidth={1.2} />
          ))}
        </svg>
        <p className="mt-1 text-center font-mono text-[10px] text-fog">binary tree</p>
      </div>
    </CardShell>
  );
}
