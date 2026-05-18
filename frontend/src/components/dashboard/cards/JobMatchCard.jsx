import { BriefcaseBusiness, CheckCircle2, MessageSquareWarning, SearchCheck } from "lucide-react";

const getMatchTone = (score) => {
  if (score >= 85) {
    return {
      bar: "bg-emerald-600",
      text: "text-emerald-700"
    };
  }

  if (score >= 70) {
    return {
      bar: "bg-[#1a365d]",
      text: "text-[#1a365d]"
    };
  }

  if (score >= 55) {
    return {
      bar: "bg-amber-600",
      text: "text-amber-700"
    };
  }

  return {
    bar: "bg-red-600",
    text: "text-red-700"
  };
};

const DetailList = ({ icon: Icon, items, title }) => (
  <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#1a365d]" aria-hidden="true" />
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
    </div>
    {items.length ? (
      <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-700">
        {items.map((item, index) => (
          <li className="break-words" key={`${item}-${index}`}>
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 text-sm text-slate-500">No items returned.</p>
    )}
  </div>
);

const JobMatchCard = ({ jobDescription, match }) => {
  if (!match) {
    return null;
  }

  const tone = getMatchTone(match.score);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
            Job Match Result
          </p>
          <h3 className="mt-1 break-words text-xl font-bold tracking-normal text-slate-950">
            {jobDescription?.title || match.job_title || "Selected job description"}
          </h3>
          <p className="mt-3 break-words text-sm leading-6 text-slate-600">
            {match.rationale || "The AI match result did not include a rationale."}
          </p>
        </div>
        <div className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className={`text-3xl font-bold ${tone.text}`}>{match.score}%</p>
          <p className="text-sm font-semibold text-slate-600">{match.label}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${tone.bar}`}
            style={{ width: `${Math.max(0, Math.min(100, match.score))}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <DetailList
          icon={CheckCircle2}
          items={match.matched_requirements || []}
          title="Matched Requirements"
        />
        <DetailList
          icon={MessageSquareWarning}
          items={match.missing_requirements || []}
          title="Missing or Weak Requirements"
        />
        <DetailList
          icon={BriefcaseBusiness}
          items={match.concerns || []}
          title="Concerns"
        />
        <DetailList
          icon={SearchCheck}
          items={match.interview_focus || []}
          title="Interview Focus"
        />
      </div>
    </article>
  );
};

export default JobMatchCard;
