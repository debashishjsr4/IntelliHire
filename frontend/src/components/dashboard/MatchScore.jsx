const MatchScore = ({ score }) => {
  const normalizedScore = Math.min(Math.max(score, 0), 100);

  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 sm:px-3">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[conic-gradient(#1a365d_var(--score),#e2e8f0_0)]"
        style={{ "--score": `${normalizedScore}%` }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-[#1a365d]">
          {normalizedScore}%
        </div>
      </div>
      <div className="hidden sm:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Match Score
        </p>
        <p className="text-sm font-semibold text-slate-900">Strong fit</p>
      </div>
    </div>
  );
};

export default MatchScore;
