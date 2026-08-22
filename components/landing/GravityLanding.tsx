"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GravityScene, type SceneControl, type ScenePointer } from "./GravityScene";
import { Loader } from "./Loader";
import { Reveal } from "./Reveal";
import { ControlsDrawer } from "./ControlsDrawer";

const EASE_OUT = "cubic-bezier(0.16,1,0.3,1)";

const GRADIENTS = [
  "radial-gradient(circle at center, #ffffff 0%, #ecefff 35%, #c2d1ff 100%)",
  "radial-gradient(circle at center, #ffffff 0%, #fbffe5 38%, #e8ff9c 100%)",
  "radial-gradient(circle at center, #ffffff 0%, #fff0f1 38%, #ffd1d5 100%)",
];

/* ---------- inline lucide icons ---------- */

const SlidersIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="21" x2="14" y1="4" y2="4" />
    <line x1="10" x2="3" y1="4" y2="4" />
    <line x1="21" x2="12" y1="12" y2="12" />
    <line x1="8" x2="3" y1="12" y2="12" />
    <line x1="21" x2="16" y1="20" y2="20" />
    <line x1="12" x2="3" y1="20" y2="20" />
    <line x1="14" x2="14" y1="2" y2="6" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="16" x2="16" y1="18" y2="22" />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ArrowDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);

const MousePointerIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.586 12.586 19 19" />
    <path d="M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z" />
  </svg>
);

const ArrowUpLeftIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 17 7 7" />
    <path d="M17 7H7v10" />
  </svg>
);

/* ---------- glass stat card ---------- */

function StatCard({
  index,
  label,
  value,
  description,
}: {
  index: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div
      className="rounded-[1.4rem] bg-gradient-to-b from-white/80 via-white/30 to-white/10 p-px transition-transform duration-300 hover:-translate-y-0.5"
      style={{ boxShadow: "0 14px 40px -12px rgba(14,42,197,0.18)" }}
    >
      <div className="relative overflow-hidden rounded-[1.35rem] bg-white/25 px-6 py-5 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-landing-mono text-[10px] text-neutral-500" dir="ltr">
              {index}
            </span>
            <span
              className="font-landing-mono text-[10px] uppercase text-neutral-400"
              style={{ letterSpacing: "0.15em" }}
            >
              {label}
            </span>
          </div>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 30%, #5175ff, #0e2ac5)",
              boxShadow: "0 0 8px rgba(47,105,255,0.6)",
            }}
          />
        </div>
        <p className="font-landing-display mt-3 text-lg font-semibold text-neutral-900">{value}</p>
        <p className="mt-1 text-[13px] leading-snug text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

/* ---------- main landing ---------- */

export function GravityLanding() {
  const controlRef = useRef<SceneControl>({ progress: 0, started: false });
  const mouseRef = useRef<ScenePointer>({ x: 99, y: 99, isDown: false });

  const [sceneReady, setSceneReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [bgStage, setBgStage] = useState(0);
  const [ballColor, setBallColor] = useState("#2F69FF");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const startedRef = useRef(false);

  /* pointer tracking (drives ball repulsion globally) */
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const onDown = () => (mouseRef.current.isDown = true);
    const onUp = () => (mouseRef.current.isDown = false);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* scroll → physics progress + background stage.
     Progress is a float "section index" (0=hero, 1=drop, 2=heart, 3=release),
     mapped piecewise through the real section offsets — on desktop each
     section is ~1 viewport so this matches scrollY/vh, but on phones section
     02 grows taller than one viewport and a plain scrollY/vh would desync the
     physics choreography from the copy that narrates it. */
  useEffect(() => {
    let raf = 0;
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const y = window.scrollY;
      const vh = window.innerHeight || 1;
      const tops = [
        0,
        document.getElementById("derekh")?.offsetTop ?? vh,
        document.getElementById("hibur")?.offsetTop ?? vh * 2,
        document.getElementById("hamraa")?.offsetTop ?? vh * 3,
        Math.max(1, document.documentElement.scrollHeight - vh),
      ];
      let progress: number;
      if (y >= tops[4]) {
        progress = 4;
      } else {
        let i = 3;
        while (i > 0 && y < tops[i]) i--;
        const span = tops[i + 1] - tops[i];
        progress = i + (span > 0 ? (y - tops[i]) / span : 0);
      }
      controlRef.current.progress = progress;
      const stage = progress > 1.55 ? 2 : progress > 0.7 ? 1 : 0;
      setBgStage((prev) => (prev === stage ? prev : stage));
    };
    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        raf = requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* lock all scrolling (wheel, touch, keyboard) while the loader is up */
  useEffect(() => {
    document.body.style.overflow = started ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [started]);

  /* smooth wheel scroll (Lenis-style), lerp 0.09 */
  useEffect(() => {
    let target = window.scrollY;
    let current = window.scrollY;
    let lastSet = window.scrollY;
    let raf = 0;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom / ctrl+wheel browser zoom — keep native
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("[data-landing-drawer]")) return;
      if (!startedRef.current) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      target = Math.max(0, Math.min(maxScroll(), target + delta));
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (Math.abs(window.scrollY - lastSet) > 1.5) {
        // external scroll (touch, keyboard, anchor) — resync
        current = window.scrollY;
        target = window.scrollY;
        lastSet = window.scrollY;
      }
      const diff = target - current;
      if (Math.abs(diff) > 0.1) {
        current += diff * 0.09;
        window.scrollTo(0, current);
        lastSet = current;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleLoaderDone = () => {
    controlRef.current.started = true;
    startedRef.current = true;
    setStarted(true);
  };

  const inStyle = (delay: number, fromY = 14, duration = 0.9): React.CSSProperties => ({
    opacity: started ? 1 : 0,
    transform: started ? "translateY(0)" : `translateY(${fromY}px)`,
    transition: `opacity ${duration}s ${EASE_OUT} ${delay}s, transform ${duration}s ${EASE_OUT} ${delay}s`,
  });

  return (
    <div className="font-landing text-[#1a1a1a]">
      {/* background gradient layers (crossfade between stages) */}
      {GRADIENTS.map((gradient, i) => (
        <div
          key={i}
          className="fixed inset-0 -z-10"
          style={{
            background: gradient,
            opacity: bgStage === i ? 1 : 0,
            transition: "opacity 1.2s cubic-bezier(0.65,0,0.35,1)",
          }}
        />
      ))}

      {/* WebGL gravity field */}
      <GravityScene
        key={ballColor}
        ballColor={ballColor}
        controlRef={controlRef}
        mouseRef={mouseRef}
        onReady={() => setSceneReady(true)}
      />

      <Loader ready={sceneReady} onDone={handleLoaderDone} />

      {/* header */}
      <header
        className="pointer-events-none fixed inset-x-0 top-0 z-30 flex h-20 items-center justify-between px-6 md:h-24 md:px-12"
        style={{
          opacity: started ? 1 : 0,
          transform: started ? "translateY(0)" : "translateY(-16px)",
          transition: `opacity 0.8s ${EASE_OUT}, transform 0.8s ${EASE_OUT}`,
        }}
      >
        <Link
          href="/"
          className="font-landing-display pointer-events-auto text-lg font-black text-neutral-950 md:text-xl"
          style={{ letterSpacing: "0.04em" }}
        >
          עברית מחברת
        </Link>

        <nav className="pointer-events-auto hidden items-center gap-12 md:flex">
          <a href="#derekh" className="text-sm font-medium transition-opacity hover:opacity-60">
            הדרך
          </a>
          <a href="#hibur" className="text-sm font-medium transition-opacity hover:opacity-60">
            חיבור
          </a>
          <a href="#hamraa" className="text-sm font-medium transition-opacity hover:opacity-60">
            המראה
          </a>
        </nav>

        <div className="pointer-events-auto flex items-center gap-2.5 md:gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="הגדרות תצוגה"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-xl transition hover:bg-white/30 md:h-11 md:w-11"
            style={{
              boxShadow: "inset 0 1.5px 2px rgba(255,255,255,0.7), 0 8px 30px rgba(0,0,0,0.04)",
            }}
          >
            <SlidersIcon className="h-4 w-4 text-neutral-800" />
          </button>

          <Link
            href="/login"
            className="group flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5 backdrop-blur-xl md:pr-6"
            style={{
              background: "rgba(255,255,255,0.12)",
              borderTop: "1px solid rgba(255,255,255,0.9)",
              borderBottom: "1px solid rgba(255,255,255,0.85)",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              borderRight: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "inset 0 1.5px 2px rgba(255,255,255,0.7), 0 8px 30px rgba(0,0,0,0.04)",
            }}
          >
            <span className="text-[13px] font-medium text-neutral-900 md:text-sm">התחברות</span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:scale-105"
              style={{
                background:
                  "radial-gradient(circle at 50% 30%, #5175ff 0%, #0e2ac5 55%, #020b40 100%)",
              }}
            >
              <ChevronLeftIcon className="h-4 w-4 text-white" />
            </span>
          </Link>
        </div>
      </header>

      {/* section 01 — hero */}
      <section className="pointer-events-none relative z-10 flex min-h-[100svh] items-end">
        <div
          className="w-full px-6 pb-12 md:px-12 md:pb-14"
          style={{ opacity: started ? 1 : 0, transition: `opacity 0.6s ${EASE_OUT}` }}
        >
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="pointer-events-auto flex flex-col items-start gap-3.5">
              <p
                className="mb-4 text-xs font-medium uppercase md:mb-6 md:text-[14px]"
                style={{ ...inStyle(0.15), color: "#0E2AC5", letterSpacing: "0.05em" }}
              >
                [ פלטפורמת לימוד עברית ]
              </p>
              <h1
                className="text-[2.6rem] font-medium leading-[0.95] tracking-tight text-neutral-950 sm:text-6xl md:whitespace-nowrap md:text-[min(6.8vw,90px)] md:leading-none"
                style={inStyle(0.28, 22, 1)}
              >
                פחות רעש. יותר עברית.
              </h1>
            </div>

            <div className="pointer-events-auto md:w-[260px]" style={inStyle(0.45)}>
              <p className="text-[15px] font-medium leading-[1.35] text-neutral-800">
                עברית מחברת היא הדרך ללמוד עברית, להתכונן לשירות ולהרגיש שייכים — צעד אחר צעד, בלי
                רעש מיותר.
              </p>
              <p
                className="font-landing-mono mt-5 text-[10px] uppercase text-neutral-500"
                style={{ letterSpacing: "0.18em" }}
              >
                © 2026 — עברית מחברת
              </p>
              <div className="mt-4 hidden animate-pulse items-center gap-2 text-neutral-500 md:flex">
                <ArrowDownIcon className="h-3.5 w-3.5" />
                <span className="font-landing-mono text-[10px] uppercase" style={{ letterSpacing: "0.2em" }}>
                  גלול
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* section 02 — the drop */}
      <section
        id="derekh"
        className="pointer-events-none relative z-10 flex min-h-[100svh] items-center px-6 pb-40 pt-32 md:px-12 md:pt-40"
      >
        <div className="grid w-full grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="pointer-events-auto lg:col-span-7">
            <Reveal>
              <p
                className="font-landing-mono text-[11px] uppercase"
                style={{ color: "rgba(14,42,197,0.8)", letterSpacing: "0.25em" }}
              >
                [ 02 — הדרך ]
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-6 text-[2.6rem] font-medium leading-[1.0] tracking-tight text-neutral-950 sm:text-6xl md:text-[80px] md:leading-[0.92]">
                כל התחלה
                <br />
                מרגישה כמו נפילה.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-lg text-base leading-[1.55] text-neutral-700 md:text-[19px]">
                המשך לגלול — השדה נכנע לכוח המשיכה. גם ללמוד שפה חדשה מרגיש ככה לפעמים: מאבדים
                אחיזה, נופלים, קופצים חזרה. כל כדור כאן מציית לפיזיקה אמיתית — מסה, תנופה, ועוד
                קפיצה אחת קטנה עד שהאנרגיה נרגעת.
              </p>
            </Reveal>
          </div>

          <div className="pointer-events-auto lg:col-span-5 lg:pt-3">
            <Reveal delay={0.25}>
              <div className="flex flex-col gap-3.5">
                <StatCard
                  index="01"
                  label="רמות"
                  value="מבחן רמה אישי"
                  description="שיעורים שמותאמים בדיוק לרמה שלך — מתחיל, בינוני או מתקדם"
                />
                <StatCard
                  index="02"
                  label="תרגול"
                  value="כרטיסיות ומבחנים"
                  description="תרגילים ומבחנים שנבנו במיוחד בשבילך על ידי המפקד האישי שלך"
                />
                <StatCard
                  index="03"
                  label="ליווי"
                  value="מפקד אישי"
                  description="כל חייל מקושר למפקד שמלווה אותו לכל אורך הדרך"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* section 03 — the heart */}
      <section
        id="hibur"
        className="pointer-events-none relative z-10 flex min-h-[100svh] flex-col justify-between px-6 py-36 md:px-12 md:py-44"
      >
        <div className="pointer-events-auto">
          <Reveal>
            <p
              className="font-landing-mono text-[11px] uppercase"
              style={{ color: "rgba(14,42,197,0.8)", letterSpacing: "0.25em" }}
            >
              [ 03 — חיבור ]
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 max-w-2xl text-[2.6rem] font-medium leading-[1.0] tracking-tight text-neutral-950 sm:text-6xl md:text-[80px] md:leading-[0.92]">
              מתוך הכאוס, נוצר חיבור.
            </h2>
          </Reveal>
        </div>

        <div className="pointer-events-auto max-w-sm self-end text-start md:text-end">
          <Reveal delay={0.15}>
            <p className="text-base leading-[1.55] text-neutral-700 md:text-[19px]">
              מתוך הנפילה החופשית, השדה מתארגן מחדש — כל כדור מוצא את מקומו בצורה אחת שלמה. ככה גם
              קהילה נבנית: אחד ועוד אחד, עד שנוצר לב. העבר/י את הסמן דרכו וצפה/י בסדר מתערער,
              מתפזר ומתאושש.
            </p>
          </Reveal>
          <Reveal delay={0.28}>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/35 px-4 py-2.5 text-neutral-700 backdrop-blur-md">
              <MousePointerIcon className="h-3.5 w-3.5" />
              <span className="font-landing-mono text-[10px] uppercase" style={{ letterSpacing: "0.2em" }}>
                עבור עם הסמן
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* section 04 — release */}
      <section
        id="hamraa"
        className="pointer-events-none relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-36 text-center md:px-12 md:py-44"
      >
        <div className="pointer-events-auto mx-auto max-w-3xl">
          <Reveal>
            <p
              className="font-landing-mono text-[11px] uppercase"
              style={{ color: "rgba(14,42,197,0.8)", letterSpacing: "0.25em" }}
            >
              [ 04 — המראה ]
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <h2 className="mt-7 text-[2.8rem] font-medium leading-[1.0] tracking-tight text-neutral-950 sm:text-7xl md:text-[88px] md:leading-[0.92]">
              ואז,
              <br />
              ממריאים.
            </h2>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mx-auto mt-8 max-w-md text-base leading-[1.55] text-neutral-700 md:text-[19px]">
              כשמגיע הרגע — כל מה שלמדת מתרומם איתך. פחות רעש, יותר ביטחון, ועברית שמחברת אותך
              לאנשים שסביבך.
            </p>
          </Reveal>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 overflow-hidden rounded-t-[2.5rem] bg-neutral-950 text-white md:rounded-t-[4rem]">
        <div
          className="pointer-events-none absolute -top-24 left-0 h-[28rem] w-[28rem] blur-2xl"
          style={{ background: "radial-gradient(circle, #2f69ff66 0%, transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-0 h-[32rem] w-[32rem] blur-2xl"
          style={{ background: "radial-gradient(circle, #5175ff44 0%, transparent 65%)" }}
        />

        {/* marquee */}
        <div className="overflow-hidden border-b border-white/10 py-5" dir="ltr">
          {/* 4 copies (animation loops at -50% = two copies' width) so the
              strip stays seamless up to ~3300px-wide viewports */}
          <div className="landing-marquee inline-flex items-center whitespace-nowrap">
            {[0, 1, 2, 3].map((repeat) => (
              <div key={repeat} className="inline-flex items-center">
                {["פחות רעש", "יותר עברית", "לומדים יחד", "מתחילים עכשיו"].map((word) => (
                  <span key={word} className="inline-flex items-center">
                    <span
                      className="px-8 font-medium text-white/90"
                      style={{ fontSize: "clamp(28px, 6vw, 64px)" }}
                    >
                      {word}
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#2f69ff" }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="relative px-6 pb-10 pt-16 md:px-12 md:pt-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* CTA */}
            <Reveal className="lg:col-span-5">
              <p
                className="font-landing-mono text-[11px] uppercase text-white/40"
                style={{ letterSpacing: "0.25em" }}
              >
                [ מוכנים להתחיל? ]
              </p>
              <h2 className="mt-6 text-4xl font-medium leading-[0.95] md:text-6xl">
                יש לך דרך
                <br />
                לעבור? נלווה אותך.
              </h2>
              <Link
                href="/login"
                className="group mt-10 inline-flex items-center gap-4 rounded-full border border-white/15 bg-white/5 py-2 pl-2 pr-7 transition hover:bg-white/10"
              >
                <span className="text-base font-medium md:text-lg">כניסה לעברית מחברת</span>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 30%, #5175ff 0%, #0e2ac5 55%, #020b40 100%)",
                  }}
                >
                  <ArrowUpLeftIcon className="h-4 w-4 text-white transition-transform duration-300 group-hover:-rotate-45" />
                </span>
              </Link>
            </Reveal>

            {/* link columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
              {[
                {
                  title: "למידה",
                  links: [
                    { label: "השיעורים שלי", href: "/learner/lessons" },
                    { label: "מבחן רמה", href: "/learner/level-test" },
                    { label: "תרגילים ומבחנים", href: "/learner/exercises" },
                  ],
                },
                {
                  title: "חשבון",
                  links: [
                    { label: "התחברות", href: "/login" },
                    { label: "הרשמה", href: "/login?mode=signup" },
                  ],
                },
                {
                  title: "אזורים",
                  links: [
                    { label: "אזור חייל", href: "/learner/dashboard" },
                    { label: "אזור מפקד", href: "/commander/dashboard" },
                  ],
                },
              ].map((column, i) => (
                <Reveal key={column.title} delay={i * 0.08}>
                  <p
                    className="font-landing-mono text-[10px] uppercase text-white/40"
                    style={{ letterSpacing: "0.25em" }}
                  >
                    {column.title}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="group inline-flex items-center gap-1.5 text-[15px] text-white/75 transition hover:text-white"
                        >
                          {link.label}
                          <ArrowUpLeftIcon className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>

          {/* bottom bar */}
          <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center md:mt-28">
            <div className="flex items-center gap-3">
              <span className="font-landing-display font-black" style={{ letterSpacing: "0.04em" }}>
                עברית מחברת
              </span>
              <span className="h-2 w-2 rounded-full" style={{ background: "#2f69ff" }} />
              <span className="font-landing-mono text-[11px] text-white/40">
                © 2026 עברית מחברת — כל הזכויות שמורות.
              </span>
            </div>
          </div>
        </div>
      </footer>

      <ControlsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedBallColor={ballColor}
        onSelect={(color) => setBallColor(color)}
      />
    </div>
  );
}
