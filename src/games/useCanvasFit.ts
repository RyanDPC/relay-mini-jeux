import { useEffect, useRef, type RefObject } from "react";

/** Keeps canvas bitmap resolution matched to its CSS box (crisp fullscreen). */
export function useCanvasFit(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  aspect = 16 / 9,
  onResize?: () => void,
) {
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const apply = () => {
      const rect = parent.getBoundingClientRect();
      const cssW = Math.max(320, Math.floor(rect.width));
      const cssH = Math.max(220, Math.floor(rect.height || cssW / aspect));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.floor(cssW * dpr);
      const bh = Math.floor(cssH * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      onResizeRef.current?.();
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [canvasRef, aspect]);
}
