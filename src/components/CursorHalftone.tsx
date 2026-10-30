import { useEffect, useRef } from "react";

/** Decorative background only; never intercepts restaurant or form interactions. */
export function CursorHalftone() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const enabled = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastTime = 0;
    const trail: { x: number; y: number; time: number }[] = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = (now: number) => {
      frame = 0;
      context.clearRect(0, 0, width, height);
      while (trail.length && now - trail[0].time > 950) trail.shift();
      if (!enabled.matches || !trail.length) return;
      context.fillStyle = getComputedStyle(canvas).color;
      const minX = Math.max(0, Math.min(...trail.map(point => point.x)) - 90);
      const maxX = Math.min(width, Math.max(...trail.map(point => point.x)) + 90);
      const minY = Math.max(0, Math.min(...trail.map(point => point.y)) - 90);
      const maxY = Math.min(height, Math.max(...trail.map(point => point.y)) + 90);
      for (let x = Math.floor(minX / 10) * 10; x <= maxX; x += 10) {
        for (let y = Math.floor(minY / 10) * 10; y <= maxY; y += 10) {
          let strength = 0;
          for (const point of trail) {
            const distance = Math.hypot(x - point.x, y - point.y);
            strength = Math.max(strength, Math.max(0, 1 - distance / 90) * (1 - (now - point.time) / 950));
          }
          if (strength < 0.02) continue;
          const eased = Math.pow(strength, 0.7);
          context.globalAlpha = Math.min(1, eased * 0.75);
          context.beginPath();
          context.arc(x, y, 1 + eased * 2.4, 0, Math.PI * 2);
          context.fill();
        }
      }
      frame = requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      if (!enabled.matches || event.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - lastTime < 20) return;
      lastTime = now;
      trail.push({ x: event.clientX, y: event.clientY, time: now });
      if (trail.length > 34) trail.shift();
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const clear = () => {
      trail.length = 0;
      context.clearRect(0, 0, width, height);
      cancelAnimationFrame(frame);
      frame = 0;
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", clear);
    window.addEventListener("blur", clear);
    enabled.addEventListener("change", clear);
    return () => {
      clear();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", clear);
      window.removeEventListener("blur", clear);
      enabled.removeEventListener("change", clear);
    };
  }, []);

  return <canvas ref={canvasRef} className="rm-cursor-halftone" aria-hidden="true" />;
}