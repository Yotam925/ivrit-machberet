"use client";

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  ballColor: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "roseGold",
    name: "כחול מלכותי",
    description: "כדורי קובלט חדים שמרחפים על מפל צבעים לבן-רך.",
    primaryColor: "#2F69FF",
    ballColor: "#2F69FF",
  },
  {
    id: "pinkBlush",
    name: "ורוד קרם",
    description: "ורודים מתוקים ונגיעות תות עסיסיות בסטודיו פנינה.",
    primaryColor: "#FFA6B3",
    ballColor: "#FFC5C2",
  },
  {
    id: "voltLime",
    name: "ליים חשמלי",
    description: "ליים ניאון חשמלי על אופק לבן ונקי.",
    primaryColor: "#E1FC03",
    ballColor: "#E1FC03",
  },
  {
    id: "arcticBlue",
    name: "תכלת קרח",
    description: "כחולים קפואים ושקופים עם ברק זכוכית.",
    primaryColor: "#96E5FF",
    ballColor: "#96E5FF",
  },
];

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

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
  </svg>
);

const RotateCcwIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export function ControlsDrawer({
  open,
  onClose,
  selectedBallColor,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  selectedBallColor: string;
  onSelect: (ballColor: string) => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-neutral-950/20 backdrop-blur-sm"
        style={{
          opacity: open ? 0.4 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
        onClick={onClose}
      />
      <aside
        data-landing-drawer
        className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l border-neutral-100 bg-white/95 p-8 backdrop-blur-xl sm:w-[420px]"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.55s cubic-bezier(0.32,1.25,0.46,1)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SlidersIcon className="h-4 w-4 text-neutral-900" />
            <span
              className="font-landing-display font-black uppercase text-neutral-900"
              style={{ fontSize: 14, letterSpacing: "0.2em" }}
            >
              לוח בקרה
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-100"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="font-landing-mono mt-6 text-xs italic text-neutral-400">
          בחר/י את צבע הכדורים של הפתיח. בזמן הגלילה הסצנה תשתנה לירוק-ליים, ואז לוורוד — כשהלב
          מתגבש.
        </p>

        <div className="mt-8">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-3.5 w-3.5 text-neutral-900" />
            <span
              className="font-landing-mono font-bold uppercase text-neutral-900"
              style={{ fontSize: 10, letterSpacing: "0.2em" }}
            >
              ערכות צבע
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {THEME_PRESETS.map((preset) => {
              const selected = preset.ballColor === selectedBallColor;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelect(preset.ballColor)}
                  className={`rounded-xl border p-4 text-start transition ${
                    selected
                      ? "scale-[1.02] border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white hover:border-neutral-400"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-bold">{preset.name}</span>
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: preset.primaryColor }}
                    />
                  </span>
                  <span
                    className={`mt-1 block text-[10px] ${selected ? "text-white/60" : "text-neutral-500"}`}
                  >
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-100 pt-6">
          <div className="font-landing-mono flex flex-col gap-1.5 text-[9px] text-neutral-400" dir="ltr">
            <p>RENDER ENGINE / THREE.JS WEBGL</p>
            <p>DYNAMICS SOLVER / 3D COLLISION VERLET</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect("#2F69FF")}
            className="mt-5 flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            <RotateCcwIcon className="h-3.5 w-3.5" />
            איפוס ברירת מחדל
          </button>
        </div>
      </aside>
    </>
  );
}
