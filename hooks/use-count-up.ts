"use client";

import { useEffect, useState } from "react";

const COUNT_MS = 900;

export function useCountUp(
  target: number,
  options: { play: boolean; active: boolean },
) {
  const { play, active } = options;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!play || !active || target <= 0) {
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) {
        start = now;
      }
      const progress = Math.min(1, (now - start) / COUNT_MS);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };
    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [active, play, target]);

  if (!play) {
    return { value: target, done: true };
  }
  if (!active) {
    return { value: 0, done: false };
  }
  if (target <= 0) {
    return { value: 0, done: true };
  }
  return { value, done: value >= target };
}
