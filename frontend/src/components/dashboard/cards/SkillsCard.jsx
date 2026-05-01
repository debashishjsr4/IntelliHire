const getSkillStrength = (skill, index) => {
  const characterTotal = skill
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return Math.min(96, 72 + ((characterTotal + index * 7) % 25));
};

const SkillsCard = ({ skills }) => {
  const skillScores = skills.slice(0, 5).map((skill, index) => ({
    name: skill,
    score: getSkillStrength(skill, index)
  }));

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

      <div className="space-y-5">
        {skillScores.map((skill) => (
          <div key={skill.name}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800">{skill.name}</span>
              <span className="text-sm font-bold text-[#1a365d]">{skill.score}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#1a365d] transition-all duration-700"
                style={{ width: `${skill.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};

export default SkillsCard;

