"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient starfield for the hero, in the particle-hero style: a dense field of
 * thin vertical streaks that drift upward, each twinkling and fading out after a
 * random delay before respawning. Fills its nearest positioned ancestor. Honours
 * prefers-reduced-motion by drawing a single static frame.
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
    type Streak = { x: number; y: number; speed: number; opacity: number; fadeStart: number; fadingOut: boolean };
    let streaks: Streak[] = [];

    function reset(s: Streak) {
      s.x = Math.random() * w;
      s.y = Math.random() * h;
      s.speed = Math.random() / 5 + 0.1;
      s.opacity = 1;
      s.fadeStart = Date.now() + Math.random() * 600 + 100;
      s.fadingOut = false;
    }

    function init() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(380, Math.floor((w * h) / 7000));
      streaks = [];
      for (let i = 0; i < count; i++) {
        const s: Streak = { x: 0, y: 0, speed: 0, opacity: 1, fadeStart: 0, fadingOut: false };
        reset(s);
        streaks.push(s);
      }
    }

    function paint(animate: boolean) {
      c.clearRect(0, 0, w, h);
      const now = Date.now();
      for (const s of streaks) {
        if (animate) {
          s.y -= s.speed;
          if (s.y < 0) reset(s);
          if (!s.fadingOut && now > s.fadeStart) s.fadingOut = true;
          if (s.fadingOut) {
            s.opacity -= 0.008;
            if (s.opacity <= 0) reset(s);
          }
        }
        // Cool white-to-cyan streak, like the reference particles.
        c.fillStyle = `rgba(${Math.floor(255 - Math.random() * 128)}, 255, 255, ${s.opacity})`;
        c.fillRect(s.x, s.y, 0.5, Math.random() * 2 + 1);
      }
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

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
