import SkillScoreList from "../SkillScoreList.jsx";
import SkillScoreGuide from "../SkillScoreGuide.jsx";

const SkillsCard = ({ skillScores = [] }) => {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
          Skill Evidence
        </p>
        <h3 className="mt-1 text-xl font-bold tracking-normal text-slate-950">
          Strengths and Mentions
        </h3>
      </div>

      <div className="mb-5">
        <SkillScoreGuide />
      </div>

      <SkillScoreList skillScores={skillScores} />
    </article>
  );
};

export default SkillsCard;
