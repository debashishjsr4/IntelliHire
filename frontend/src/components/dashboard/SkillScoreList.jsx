const skillGroups = [
  {
    id: "strengths",
    title: "Strengths",
    description: "Good resume evidence and higher confidence.",
    filter: (skill) => skill.score >= 75
  },
  {
    id: "moderate",
    title: "Moderate Evidence",
    description: "Useful skills, but depth or ownership is less clear.",
    filter: (skill) => skill.score >= 55 && skill.score < 75
  },
  {
    id: "mentions",
    title: "Low-Evidence Mentions",
    description: "Mentioned in the CV, but not clearly a strength.",
    filter: (skill) => skill.score < 55
  }
];

const SkillScoreList = ({ skillScores = [], columns = false }) => {
  if (!skillScores.length) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
        No skills were extracted from this resume.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {skillGroups.map((group) => {
        const groupSkills = skillScores.filter(group.filter);

        if (!groupSkills.length) {
          return null;
        }

        return (
          <section className="min-w-0" key={group.id}>
            <div className="mb-3">
              <h4 className="text-sm font-bold tracking-normal text-slate-900">
                {group.title}
              </h4>
              <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p>
            </div>

            <div className={columns ? "grid min-w-0 gap-3 xl:grid-cols-2" : "space-y-4"}>
              {groupSkills.map((skill) => (
                <div
                  className={columns ? "min-w-0 rounded-md border border-slate-200 bg-white p-4 shadow-sm" : "min-w-0"}
                  key={skill.name}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
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
                    <span className="shrink-0 text-sm font-bold text-[#1a365d]">
                      {skill.score}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#1a365d]"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                  {skill.evidence ? (
                    <p className="mt-2 break-words text-xs leading-5 text-slate-500">
                      {skill.evidence}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default SkillScoreList;
