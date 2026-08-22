"use client";

import { useEffect, useRef } from "react";

/* Stack feel constants — from the "Cards Almanac" design spec */
const S = {
  baseVh: 5, // floor: never pin a card higher than this (cards otherwise centre in the viewport)
  peekPx: 34, // vertical offset per card → how much of each earlier card peeks above the next
  gapVh: 46, // scroll length (vh) between cards → the pacing of the reveal
  revealPx: 480, // distance over which an incoming card eases from "arriving" to "pinned"
  revealAt: 0.5, // reveal a card's content once this fraction of it is on screen
  persp: 1500, // 3D perspective (px) applied per card
  arriveTilt: 15, // deg an incoming card is inclined as it rises, easing to flat when it pins
  buriedTilt: 3, // deg each buried card reclines back per card stacked on top
  scaleStep: 0.035, // how much each buried card shrinks per card on top
  dimStep: 0.02, // how much each buried card dims per card on top
  liftPx: 4, // how much each buried card tucks up per card on top
  maxBuriedDepth: 6, // clamp for the styling depth so deep stacks don't collapse into broken geometry
};

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function AlmPlusIcon() {
  return (
    <svg
      className="i-plus"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function AlmCheckIcon() {
  return (
    <svg
      className="i-check"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CardStack({
  cards,
  cardLabel = "כרטיס",
}: {
  cards: { key: string; content: React.ReactNode }[];
  cardLabel?: string;
}) {
  const stackRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const cardLabelRef = useRef(cardLabel);
  cardLabelRef.current = cardLabel;

  useEffect(() => {
    const stack = stackRef.current;
    const live = liveRef.current;
    if (!stack || !live) return;

    // the reveal choreography (content hidden until '-in') only applies once
    // this script is live — without JS the server-rendered cards stay readable
    stack.classList.add("alm-js");

    const cardEls = Array.from(stack.querySelectorAll<HTMLElement>(":scope > .alm-card"));
    const N = cardEls.length;
    if (!N) return;

    // seed from the DOM so '-in' classes surviving an add/remove re-run stay in sync
    const shown = cardEls.map((el) => el.classList.contains("-in"));

    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = mq.matches;
    const onMqChange = () => {
      reduce = mq.matches;
      onScroll();
    };
    mq.addEventListener?.("change", onMqChange);

    let restTops: number[] = [];
    let heights: number[] = [];
    let lastCur = -1;
    let queued = false;
    let raf = 0;
    let lastLayoutW = 0;
    let lastLayoutH = 0;

    // while a mobile keyboard is open (focus in one of the stack's fields),
    // never re-pin the pile under the user's fingers
    const typingInStack = () => {
      const a = document.activeElement;
      return !!(a && stack.contains(a) && (a.tagName === "INPUT" || a.tagName === "TEXTAREA"));
    };

    function layout() {
      const vh = innerHeight;
      lastLayoutW = innerWidth;
      lastLayoutH = vh;
      heights = cardEls.map((el) => el.offsetHeight);
      const cardH = Math.max(...heights);
      // centre the pile: the middle card sits in the middle of the viewport, the rest fan around it
      const centred = (vh - cardH) / 2 - ((N - 1) / 2) * S.peekPx;
      const base = Math.max(centred, (S.baseVh / 100) * vh); // never pin above the baseVh floor
      // compress the fan when the stack is long, so even the last card pins fully on screen
      // (with an unbounded fan, cards past ~index 16 would pin below the reveal line and
      // never show their content)
      const peek =
        N > 1 ? Math.min(S.peekPx, Math.max(0, (vh - cardH - base) / (N - 1))) : S.peekPx;
      restTops = cardEls.map((el, i) => {
        const t = Math.round(base + i * peek);
        el.style.setProperty("--top", t + "px");
        return t;
      });
    }

    function update() {
      queued = false;
      const vh = innerHeight;
      // risen[i] ∈ [0,1]: how fully card i has arrived at its pin; tops for reveal
      const risen: number[] = [];
      const tops: number[] = [];
      cardEls.forEach((el, i) => {
        const top = el.getBoundingClientRect().top;
        tops[i] = top;
        risen[i] = clamp((restTops[i] + S.revealPx - top) / S.revealPx, 0, 1);
      });
      // suffix = how many later cards are currently stacked over card i (continuous)
      let suffix = 0;
      for (let i = N - 1; i >= 0; i--) {
        const el = cardEls[i];
        // styling depth is clamped so a 30-card pile doesn't drive scale/tilt negative
        const b = Math.min(suffix, S.maxBuriedDepth);
        if (reduce) {
          el.style.transform = "";
          el.style.filter = "";
        } else {
          // incline while arriving (eases to flat at the pin), recline slightly once buried
          const rx = S.arriveTilt * (1 - risen[i]) - S.buriedTilt * b;
          el.style.transform = `perspective(${S.persp}px) translateY(${(-b * S.liftPx).toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) scale(${(1 - S.scaleStep * b).toFixed(4)})`;
          el.style.filter = `brightness(${(1 - S.dimStep * b).toFixed(4)})`;
        }
        el.style.zIndex = String(10 + i);
        // a card fully covered by the next one leaves the tab order — otherwise
        // keyboard focus lands on controls hidden underneath the pile
        (el as unknown as { inert: boolean }).inert = suffix >= 0.98;
        // reveal once ~half of THIS card is on screen (per-card height, since
        // quiz cards, flashcards and builder cards genuinely differ in height)
        const h = heights[i] || 400;
        const revealLine = vh - S.revealAt * h;
        const hideLine = vh - 0.04 * h;
        if (!shown[i] && tops[i] <= revealLine) {
          el.classList.add("-in");
          shown[i] = true;
        } else if (shown[i] && tops[i] >= hideLine) {
          el.classList.remove("-in");
          shown[i] = false;
        }
        suffix += risen[i];
      }
      // announce the active card (a11y)
      const cur = clamp(
        Math.round(risen.reduce((a, r) => a + r, 0)),
        1,
        N,
      );
      if (cur !== lastCur) {
        lastCur = cur;
        live!.textContent = `${cardLabelRef.current} ${cur} מתוך ${N}`;
      }
    }

    function onScroll() {
      if (!queued) {
        queued = true;
        raf = requestAnimationFrame(update);
      }
    }

    function onResize() {
      if (typingInStack()) return;
      // re-pin only on real resizes — mobile URL-bar show/hide fires small
      // height-only resize events on every scroll
      if (Math.abs(innerWidth - lastLayoutW) > 2 || Math.abs(innerHeight - lastLayoutH) > 150) {
        layout();
      }
      onScroll();
    }

    // card heights change when content changes (e.g. a flashcard flips to a
    // longer definition, text wraps after typing) — re-pin accordingly
    const cardResizeObserver = new ResizeObserver(() => {
      if (typingInStack()) return;
      layout();
      onScroll();
    });
    cardEls.forEach((el) => cardResizeObserver.observe(el));

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    layout();
    update();
    // re-measure once fonts/content settle
    const settle = setTimeout(() => {
      layout();
      onScroll();
    }, 400);

    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      mq.removeEventListener?.("change", onMqChange);
      cardResizeObserver.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      cardEls.forEach((el) => {
        (el as unknown as { inert: boolean }).inert = false;
      });
    };
  }, [cards.length]);

  return (
    <div ref={stackRef} className="alm-stack">
      {cards.map((card) => (
        <article key={card.key} className="alm-card">
          {card.content}
        </article>
      ))}
      <div className="alm-tail" aria-hidden="true" />
      <div ref={liveRef} className="alm-sr" aria-live="polite" />
    </div>
  );
}
