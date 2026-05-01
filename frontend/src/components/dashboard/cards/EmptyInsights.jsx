import { BarChart3 } from "lucide-react";

const EmptyInsights = () => {
  return (
    <section className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-[#1a365d]">
          <BarChart3 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-xl font-bold tracking-normal text-slate-950">
          Candidate insights will appear here
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Upload a PDF resume to review the AI summary, skill strengths, and timeline.
        </p>
      </div>
    </section>
  );
};

export default EmptyInsights;
