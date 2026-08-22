"use client";

import { useEffect, useRef, useState } from "react";

export function Loader({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [value, setValue] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  const readyRef = useRef(ready);
  readyRef.current = ready;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setMounted(true);

    let raf = 0;
    let last = performance.now();
    let v = 0;
    let finishScheduled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!readyRef.current) {
        v += (92 - v) * 1.7 * dt;
      } else {
        v += (100 - v) * 6 * dt;
        if (v >= 99.4) v = 100;
      }
      setValue(v);

      if (v >= 99.9 && readyRef.current && !finishScheduled) {
        finishScheduled = true;
        timeouts.push(
          setTimeout(() => setLeaving(true), 140),
          setTimeout(() => {
            onDoneRef.current();
            setGone(true);
          }, 140 + 520),
        );
        return; // loader finished — stop the rAF loop
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  if (gone) return null;

  const springIn = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(18px)",
    filter: mounted ? "blur(0)" : "blur(6px)",
    transition: `opacity 0.9s cubic-bezier(0.22,1.4,0.36,1) ${delay}s, transform 0.9s cubic-bezier(0.22,1.4,0.36,1) ${delay}s, filter 0.9s cubic-bezier(0.22,1.4,0.36,1) ${delay}s`,
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at 50% 42%, #ffffff 0%, #eef2ff 45%, #dbe4ff 100%)",
        opacity: leaving ? 0 : 1,
        transition: "opacity 0.55s cubic-bezier(0.65,0,0.35,1)",
        pointerEvents: leaving ? "none" : "auto",
        // iOS ignores body overflow:hidden for touch — block scroll gestures
        // that start on the overlay itself as well.
        touchAction: "none",
        overscrollBehavior: "none",
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: 26 }}>
        <p
          className="font-landing-mono uppercase"
          style={{ ...springIn(0.1), fontSize: 10, letterSpacing: "0.28em", color: "#6b7bb5" }}
        >
          {value < 100 ? "מכייל את שדה הכבידה" : "נכנסים למסלול"}
        </p>
        <div
          style={{
            ...springIn(0.26),
            width: "clamp(180px, 32vw, 280px)",
            height: 2,
            background: "rgba(14,42,197,0.14)",
            borderRadius: 99,
          }}
        >
          <div
            style={{
              width: `${value}%`,
              height: "100%",
              borderRadius: 99,
              background: "linear-gradient(90deg, #5175ff 0%, #0e2ac5 100%)",
              boxShadow: "0 0 14px rgba(47,105,255,0.55)",
              transition: "width 0.45s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>
        <p
          className="font-landing-mono font-bold tabular-nums"
          dir="ltr"
          style={{ ...springIn(0.42), fontSize: 11, letterSpacing: "0.1em", color: "#0e2ac5" }}
        >
          {String(Math.floor(value)).padStart(3, "0")}%
        </p>
      </div>
    </div>
  );
}
