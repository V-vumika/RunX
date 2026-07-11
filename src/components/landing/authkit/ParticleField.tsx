"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient starfield behind the whole landing: faint white dots that drift upward
 * while twinkling, on a fixed full-viewport canvas. Sits above the midnight base
 * and below the content. Honours prefers-reduced-motion by drawing a single
 * static frame instead of animating.
 */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const canvas: HTMLCanvasElement = cv;
    const c: CanvasRenderingContext2D = ctx;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    type P = { x: number; y: number; r: number; s: number; o: number; t: number; tw: number };
    let dots: P[] = [];

    function init() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(120, Math.floor((w * h) / 17000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1 + 0.25,
        s: Math.random() * 0.22 + 0.05, // upward speed
        o: Math.random() * 0.26 + 0.04, // base opacity (dim)
        t: Math.random() * Math.PI * 2, // twinkle phase
        tw: Math.random() * 0.028 + 0.008, // twinkle speed
      }));
    }

    function paint(animate: boolean) {
      c.clearRect(0, 0, w, h);
      for (const p of dots) {
        if (animate) {
          p.y -= p.s;
          p.t += p.tw;
          if (p.y < -2) {
            p.y = h + 2;
            p.x = Math.random() * w;
          }
        }
        const twinkle = animate ? 0.45 + 0.55 * Math.sin(p.t) : 1;
        c.globalAlpha = p.o * twinkle;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fillStyle = "#dbe7fb";
        c.fill();
      }
      c.globalAlpha = 1;
    }

    function loop() {
      paint(true);
      raf = requestAnimationFrame(loop);
    }

    init();
    if (reduce) {
      paint(false);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onResize = () => init();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
