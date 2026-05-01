import { Sparkles } from "lucide-react";

const SummaryCard = ({ summary }) => {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
            Summary
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-normal text-slate-950">
            AI Candidate Overview
          </h3>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-[#1a365d]">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <p className="max-w-3xl text-lg leading-8 text-slate-700">
        {summary || "No summary returned for this candidate."}
      </p>
    </article>
  );
};

export default SummaryCard;

