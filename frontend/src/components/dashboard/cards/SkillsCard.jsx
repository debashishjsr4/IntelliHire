import SkillScoreGuide from "../SkillScoreGuide.jsx";

const SkillsCard = ({ skillScores = [] }) => {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
          Top Skills
        </p>
        <h3 className="mt-1 text-xl font-bold tracking-normal text-slate-950">
          Technical Strength
        </h3>
      </div>

      <div className="mb-5">
        <SkillScoreGuide />
      </div>

      <div className="space-y-5">
        {skillScores.length ? skillScores.map((skill) => (
          <div key={skill.name}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-800">
                  {skill.name}
                </span>
                {skill.level ? (
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {skill.level}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-bold text-[#1a365d]">{skill.score}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#1a365d] transition-all duration-700"
                style={{ width: `${skill.score}%` }}
              />
            </div>
            {skill.evidence ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">{skill.evidence}</p>
            ) : null}
          </div>
        )) : (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
            No skills were extracted from this resume.
          </div>
        )}
      </div>
    </article>
  );
};

export default SkillsCard;
