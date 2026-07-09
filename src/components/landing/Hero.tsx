import { LaunchButton } from "./LaunchButton";
import { GridBackdrop } from "./authkit/GridBackdrop";
import { Eyebrow } from "./authkit/Eyebrow";

/**
 * Hero in the AuthKit "frosted glass cathedral" style: a spotlight beam over a
 * blueprint grid, a single luminous gradient wordmark, and three floating glass
 * plates that show what RunX actually does (step through code, watch memory,
 * animate a structure) fanned like prototypes in a dark studio.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <GridBackdrop spotlight />

      <div className="relative mx-auto max-w-5xl px-6 pt-24 text-center sm:pt-28">
        <Eyebrow>Now running in your browser</Eyebrow>

        <h1 className="ak-skywash mt-8 font-display font-medium leading-[0.9] tracking-tight text-[clamp(4.5rem,15vw,11rem)]">
          RunX
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-mist">
          See how your code actually runs. Every line, every variable, every step,
          drawn as it happens instead of hidden behind a single answer.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <LaunchButton />
          <LaunchButton variant="ghost" href="#showcase" label="See what it shows" withArrow={false} />
        </div>
      </div>

      <FloatingPlates />
    </section>
  );
}

function FloatingPlates() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl px-6 pb-24">
      <div className="relative h-[300px] sm:h-[360px]">
        {/* left plate: memory */}
        <div className="absolute left-1/2 top-8 hidden w-64 -translate-x-[122%] -rotate-[7deg] opacity-90 lg:block">
          <MemoryPlate />
        </div>
        {/* right plate: structure */}
        <div className="absolute left-1/2 top-8 hidden w-64 translate-x-[22%] rotate-[7deg] opacity-90 lg:block">
          <StructurePlate />
        </div>
        {/* center plate: the stepping window */}
        <div className="absolute left-1/2 top-0 w-full max-w-[380px] -translate-x-1/2">
          <StepperPlate />
        </div>
      </div>
    </div>
  );
}

function PlateFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ak-glass-deep overflow-hidden rounded-2xl">
      <div className="flex items-center gap-1.5 border-b border-[rgba(186,215,247,0.08)] px-3 py-2.5">
        <span className="size-2 rounded-full bg-[rgba(228,109,76,0.7)]" />
        <span className="size-2 rounded-full bg-[rgba(216,236,248,0.5)]" />
        <span className="size-2 rounded-full bg-[rgba(38,150,132,0.7)]" />
        <span className="ml-2 font-mono text-[10px] text-fog">{title}</span>
      </div>
      {children}
    </div>
  );
}

function StepperPlate() {
  const lines = [
    "def bubble_sort(a):",
    "  for i in range(len(a)):",
    "    for j in range(len(a)-1-i):",
    "      if a[j] > a[j+1]:",
    "        a[j], a[j+1] = a[j+1], a[j]",
  ];
  const active = 3;
  return (
    <PlateFrame title="main.py">
      <div className="py-3 font-mono text-[11px] leading-[1.7]">
        {lines.map((ln, i) => (
          <div key={i} className={`flex gap-2.5 px-3 ${i === active ? "bg-[rgba(250,204,21,0.12)]" : ""}`}>
            <span className="w-3 select-none text-right text-fog/50">{i + 1}</span>
            <span className={i === active ? "text-frost" : "text-fog"}>{ln}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-[rgba(186,215,247,0.08)] px-3 py-2.5">
        <span className="rounded-full bg-void-violet px-2.5 py-1 text-[10px] font-medium text-white shadow-[0_0_16px_rgba(102,58,243,0.45)]">
          Run
        </span>
        <span className="font-mono text-[10px] text-fog">step 4 of 42</span>
        <span className="ml-auto font-mono text-[10px] text-[#7fd7c0]">O(n²)</span>
      </div>
    </PlateFrame>
  );
}

function MemoryPlate() {
  return (
    <PlateFrame title="memory">
      <div className="flex flex-col gap-2 p-3">
        {[
          ["a[j]", "52"],
          ["a[j+1]", "16"],
          ["j", "2"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-md bg-[rgba(199,211,234,0.05)] px-2.5 py-1.5">
            <span className="font-mono text-[10px] text-mist">{k}</span>
            <span className="font-mono text-[11px] font-medium text-frost">{v}</span>
          </div>
        ))}
        <div className="mt-1 flex items-end gap-1">
          {[26, 40, 18, 52, 30].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${i === 3 ? "bg-[#efb54a]" : "bg-[rgba(102,58,243,0.6)]"}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>
    </PlateFrame>
  );
}

function StructurePlate() {
  const nodes = [
    { x: 50, y: 22 },
    { x: 24, y: 60 },
    { x: 76, y: 60 },
    { x: 88, y: 92 },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [2, 3],
  ];
  return (
    <PlateFrame title="structure">
      <div className="p-3">
        <svg viewBox="0 0 100 110" className="h-32 w-full">
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
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={9} fill="rgba(102,58,243,0.18)" stroke="#9b8cf7" strokeWidth={1.2} />
            </g>
          ))}
        </svg>
        <p className="mt-1 text-center font-mono text-[10px] text-fog">binary tree</p>
      </div>
    </PlateFrame>
  );
}
