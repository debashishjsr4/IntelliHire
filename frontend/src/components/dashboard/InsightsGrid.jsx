import EmptyInsights from "./cards/EmptyInsights.jsx";
import ExperienceTimelineCard from "./cards/ExperienceTimelineCard.jsx";
import InsightSkeleton from "./cards/InsightSkeleton.jsx";
import SkillsCard from "./cards/SkillsCard.jsx";
import SummaryCard from "./cards/SummaryCard.jsx";

const InsightsGrid = ({ isLoading, result }) => {
  if (isLoading) {
    return <InsightSkeleton />;
  }

  if (!result) {
    return <EmptyInsights />;
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <SummaryCard summary={result.summary} />
      <SkillsCard skillScores={result.skill_scores || result.candidate?.skill_scores || []} />
      <ExperienceTimelineCard timeline={result.experience_timeline || result.candidate?.experience_timeline || []} />
    </section>
  );
};

export default InsightsGrid;
