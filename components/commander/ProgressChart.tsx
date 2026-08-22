import type { ExerciseAttempt } from "@/lib/supabase/types";

/**
 * Improvement over time: every graded run as a percentage, oldest first.
 * Plain inline SVG — no charting library, and it renders on the server.
 */
export function ProgressChart({ attempts }: { attempts: ExerciseAttempt[] }) {
  if (attempts.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        עדיין אין תוצאות — הגרף יופיע אחרי שהחייל יגיש מבחן ראשון.
      </p>
    );
  }

  const points = attempts.map((a) => Math.round((a.score / a.total) * 100));
  const width = 640;
  const height = 220;
  const padX = 38;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  // a single attempt has no line to draw, so anchor it in the middle
  const xFor = (i: number) =>
    points.length === 1 ? padX + innerW / 2 : padX + (i / (points.length - 1)) * innerW;
  const yFor = (p: number) => padY + innerH - (p / 100) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p)}`).join(" ");
  const areaPath =
    points.length > 1
      ? `${linePath} L ${xFor(points.length - 1)} ${padY + innerH} L ${xFor(0)} ${padY + innerH} Z`
      : "";

  const average = Math.round(points.reduce((a, b) => a + b, 0) / points.length);
  const first = points[0];
  const last = points[points.length - 1];
  const delta = last - first;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="text-gray-600">
          ממוצע: <strong className="text-gray-900">{average}%</strong>
        </span>
        <span className="text-gray-600">
          אחרון: <strong className="text-gray-900">{last}%</strong>
        </span>
        {points.length > 1 && (
          <span className={delta >= 0 ? "text-green-700" : "text-red-600"}>
            {delta >= 0 ? `שיפור של ${delta}%` : `ירידה של ${Math.abs(delta)}%`} מאז ההגשה הראשונה
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full min-w-[300px]"
          /* the chart geometry is authored left-to-right; without this the
             axis labels flip into the plot area under the page's dir=rtl */
          style={{ direction: "ltr" }}
          role="img"
          aria-label={`גרף התקדמות: ${points.length} הגשות, מ־${first}% בהגשה הראשונה ל־${last}% באחרונה, ממוצע ${average}%. הפירוט המלא מופיע ברשימת ההגשות שמתחת לגרף.`}
        >
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padX}
                x2={width - padX}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padX - 8}
                y={yFor(tick) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#9ca3af"
              >
                {tick}
              </text>
            </g>
          ))}

          {areaPath && <path d={areaPath} fill="rgba(37,99,235,0.10)" />}
          {points.length > 1 && (
            <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
          )}

          {points.map((p, i) => (
            <circle key={i} cx={xFor(i)} cy={yFor(p)} r="5" fill="#2563eb">
              <title>
                {`${attempts[i].exercise_title ?? "תרגיל"} — ${p}% (${attempts[i].score}/${attempts[i].total})`}
              </title>
            </circle>
          ))}

          <text x={padX} y={height - 4} fontSize="11" fill="#9ca3af" textAnchor="start">
            {new Date(attempts[0].created_at).toLocaleDateString("he-IL")}
          </text>
          {points.length > 1 && (
            <text
              x={width - padX}
              y={height - 4}
              fontSize="11"
              fill="#9ca3af"
              textAnchor="end"
            >
              {new Date(attempts[attempts.length - 1].created_at).toLocaleDateString("he-IL")}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
