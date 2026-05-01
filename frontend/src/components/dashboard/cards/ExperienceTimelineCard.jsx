import { BriefcaseBusiness } from "lucide-react";

const ExperienceTimelineCard = ({ timeline }) => {
  const hasTimeline = timeline.length > 0;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
          Experience Timeline
        </p>
        <h3 className="mt-1 text-xl font-bold tracking-normal text-slate-950">
          Career Milestones
        </h3>
      </div>

      {hasTimeline ? (
        <div className="relative space-y-6 border-l border-slate-200 pl-6">
          {timeline.map((item, index) => (
            <div className="relative" key={`${item.title}-${item.period}-${index}`}>
              <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-[#1a365d] text-white">
                <BriefcaseBusiness className="h-3 w-3" aria-hidden="true" />
              </span>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-950">{item.title}</h4>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.company}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {item.period}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
          No career milestones were extracted from this resume.
        </div>
      )}
    </article>
  );
};

export default ExperienceTimelineCard;
