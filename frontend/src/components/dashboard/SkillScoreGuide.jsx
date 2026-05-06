import { Info } from "lucide-react";

const scoreBands = [
  { range: "90-100", label: "Expert", detail: "Deep repeated use with ownership or leadership." },
  { range: "75-89", label: "Strong", detail: "Clear practical use in jobs or major projects." },
  { range: "55-74", label: "Moderate", detail: "Some resume evidence, but limited depth or recency." },
  { range: "30-54", label: "Mentioned", detail: "Skill appears, but evidence is weak." },
  { range: "0-29", label: "Low evidence", detail: "Not enough CV evidence for confidence." }
];

const SkillScoreGuide = ({ compact = false }) => {
  return (
    <details className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-700 marker:hidden">
        <Info className="h-4 w-4 shrink-0 text-[#1a365d]" aria-hidden="true" />
        <span className="min-w-0 truncate">Skill score guide</span>
      </summary>

      <div className="mt-3 min-w-0 space-y-2">
        <p className="break-words text-xs leading-5 text-slate-500">
          Scores are based on resume evidence found by the AI, not a manual test.
        </p>
        <div className={compact ? "min-w-0 space-y-2" : "grid min-w-0 gap-2 sm:grid-cols-2"}>
          {scoreBands.map((band) => (
            <div className="min-w-0 rounded-md bg-white px-3 py-2 ring-1 ring-slate-200" key={band.range}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#1a365d]">{band.range}%</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {band.label}
                </span>
              </div>
              <p className="mt-1 break-words text-xs leading-5 text-slate-500">{band.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
};

export default SkillScoreGuide;
