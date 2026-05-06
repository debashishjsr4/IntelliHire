const getProfileScoreLabel = (score) => {
  if (score >= 90) {
    return "Exceptional";
  }

  if (score >= 75) {
    return "Strong";
  }

  if (score >= 55) {
    return "Solid";
  }

  return "Emerging";
};

const getMetricTone = (score) => {
  if (score >= 85) {
    return {
      accent: "#047857",
      text: "text-emerald-700",
    };
  }

  if (score >= 70) {
    return {
      accent: "#1a365d",
      text: "text-[#1a365d]",
    };
  }

  if (score >= 50) {
    return {
      accent: "#b45309",
      text: "text-amber-700",
    };
  }

  return {
    accent: "#b91c1c",
    text: "text-red-700",
  };
};

const MatchScore = ({ profileScore }) => {
  const hasScore =
    typeof profileScore?.score === "number" &&
    !Number.isNaN(profileScore.score);
  const normalizedScore = hasScore
    ? Math.min(Math.max(Math.round(profileScore.score), 0), 100)
    : 0;
  const label = hasScore
    ? profileScore.label || getProfileScoreLabel(normalizedScore)
    : "Awaiting CV";
  const tone = hasScore
    ? getMetricTone(normalizedScore)
    : { accent: "#94a3b8", text: "text-slate-500" };

  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 sm:px-3">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[conic-gradient(var(--metric-color)_var(--score),#e2e8f0_0)]"
        style={{
          "--metric-color": tone.accent,
          "--score": `${normalizedScore}%`,
        }}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold ${tone.text}`}
        >
          {hasScore ? `${normalizedScore}%` : "--"}
        </div>
      </div>
      <div className="hidden sm:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Profile Score
        </p>
        <p className={`text-sm font-semibold ${tone.text}`}>{label}</p>
      </div>
    </div>
  );
};

export default MatchScore;
