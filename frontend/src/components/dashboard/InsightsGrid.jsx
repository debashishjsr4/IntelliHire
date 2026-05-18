import EmptyInsights from "./cards/EmptyInsights.jsx";
import ExperienceTimelineCard from "./cards/ExperienceTimelineCard.jsx";
import InsightSkeleton from "./cards/InsightSkeleton.jsx";
import JobMatchCard from "./cards/JobMatchCard.jsx";
import SkillsCard from "./cards/SkillsCard.jsx";
import SummaryCard from "./cards/SummaryCard.jsx";

const InsightsGrid = ({ isLoading, jobDescription, result }) => {
  if (isLoading) {
    return <InsightSkeleton />;
  }

  if (!result) {
    return <EmptyInsights />;
  }

  const jobMatch =
    result.job_matches?.find((match) => match.job_description_id === jobDescription?._id) ||
    result.candidate?.job_matches?.find((match) => match.job_description_id === jobDescription?._id) ||
    result.job_matches?.[0] ||
    result.candidate?.job_matches?.[0];

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <SummaryCard summary={result.summary} />
      <JobMatchCard jobDescription={jobDescription} match={jobMatch} />
      <SkillsCard skillScores={result.skill_scores || result.candidate?.skill_scores || []} />
      <ExperienceTimelineCard timeline={result.experience_timeline || result.candidate?.experience_timeline || []} />
    </section>
  );
};

export default InsightsGrid;
