const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");

const NOT_AVAILABLE = "Not available";
const lowercaseNameParticles = new Set(["da", "de", "del", "der", "di", "la", "le", "van", "von"]);

const formatNameSegment = (segment) => {
  if (!segment) {
    return segment;
  }

  if (/^[A-Z]\.?$/i.test(segment)) {
    return segment.replace(".", "").toUpperCase();
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
};

const formatNameToken = (token, index) => {
  const normalizedToken = token.toLowerCase();

  if (index > 0 && lowercaseNameParticles.has(normalizedToken)) {
    return normalizedToken;
  }

  return token
    .split("-")
    .map((hyphenSegment) =>
      hyphenSegment
        .split("'")
        .map(formatNameSegment)
        .join("'")
    )
    .join("-");
};

const formatCandidateName = (value) => {
  if (typeof value !== "string") {
    return NOT_AVAILABLE;
  }

  const normalizedName = value.replace(/\s+/g, " ").trim();

  if (!normalizedName || normalizedName.toLowerCase() === "not available") {
    return NOT_AVAILABLE;
  }

  return normalizedName
    .split(" ")
    .map(formatNameToken)
    .join(" ");
};

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim());
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  const delimiterMatches = value.match(/[,;|]/g) || [];

  if (!delimiterMatches.length) {
    return [value.trim()];
  }

  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeTimeline = (value) => (Array.isArray(value) ? value : []);

const getSkillStrength = (skill, index) => {
  const characterTotal = skill
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return Math.min(96, 72 + ((characterTotal + index * 7) % 25));
};

const getScoreLevel = (score) => {
  if (score >= 90) {
    return "Expert";
  }

  if (score >= 75) {
    return "Strong";
  }

  if (score >= 55) {
    return "Moderate";
  }

  if (score >= 30) {
    return "Mentioned";
  }

  return "Low evidence";
};

const normalizeScoreFactor = (score) => {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const normalizeScoreFactors = (scoreFactors) => {
  const source = scoreFactors && typeof scoreFactors === "object" ? scoreFactors : {};

  return {
    direct_application: normalizeScoreFactor(source.direct_application),
    complexity: normalizeScoreFactor(source.complexity),
    ownership: normalizeScoreFactor(source.ownership),
    impact: normalizeScoreFactor(source.impact),
    recency: normalizeScoreFactor(source.recency),
    evidence_quality: normalizeScoreFactor(source.evidence_quality)
  };
};

const normalizeSkillScores = (skillScores, skills) => {
  if (Array.isArray(skillScores) && skillScores.length) {
    return skillScores
      .filter((skill) => skill && typeof skill.name === "string")
      .slice(0, 10)
      .map((skill, index) => {
        const name = skill.name.trim();
        const score =
          typeof skill.score === "number"
            ? Math.max(0, Math.min(100, Math.round(skill.score)))
            : getSkillStrength(name, index);

        return {
          name,
          score,
          level: getScoreLevel(score),
          score_factors: normalizeScoreFactors(skill.score_factors),
          evidence: typeof skill.evidence === "string" ? skill.evidence : ""
        };
      })
      .filter((skill) => skill.name);
  }

  return normalizeStringArray(skills)
    .slice(0, 10)
    .map((skill, index) => {
      const score = getSkillStrength(skill, index);

      return {
        name: skill,
        score,
        level: getScoreLevel(score),
        score_factors: {
          direct_application: score,
          complexity: 0,
          ownership: 0,
          impact: 0,
          recency: 0,
          evidence_quality: 0
        },
        evidence: ""
      };
    });
};

const getProfileScoreLabel = (score) => {
  if (score >= 90) {
    return "Exceptional";
  }

  if (score >= 75) {
    return "Strong";
  }

  if (score >= 55) {
    return "Solid";
  }

  return "Emerging";
};

const average = (values) => {
  const validValues = values.filter((value) => typeof value === "number" && !Number.isNaN(value));

  if (!validValues.length) {
    return 0;
  }

  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
};

const capScore = (score, cap) => Math.min(score, cap);

const normalizeProfileScoreFactors = (scoreFactors) => {
  const source = scoreFactors && typeof scoreFactors === "object" ? scoreFactors : {};

  return {
    professional_impact: normalizeScoreFactor(source.professional_impact),
    role_complexity: normalizeScoreFactor(source.role_complexity),
    ownership: normalizeScoreFactor(source.ownership),
    technical_depth: normalizeScoreFactor(source.technical_depth),
    career_progression: normalizeScoreFactor(source.career_progression),
    evidence_specificity: normalizeScoreFactor(source.evidence_specificity),
    recency: normalizeScoreFactor(source.recency)
  };
};

const normalizeStringList = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
    : [];

const buildFallbackProfileScore = (skillScores, experienceTimeline) => {
  const averageSkillScore = average(skillScores.map((skill) => skill.score || 0));
  const factors = {
    professional_impact: Math.round(
      average(skillScores.map((skill) => skill.score_factors?.impact || 0))
    ),
    role_complexity: Math.round(
      average(skillScores.map((skill) => skill.score_factors?.complexity || 0))
    ),
    ownership: Math.round(
      average(skillScores.map((skill) => skill.score_factors?.ownership || 0))
    ),
    technical_depth: Math.round(
      average([
        averageSkillScore,
        average(skillScores.map((skill) => skill.score_factors?.direct_application || 0)),
        average(skillScores.map((skill) => skill.score_factors?.complexity || 0))
      ])
    ),
    career_progression: Math.min(75, experienceTimeline.length * 15),
    evidence_specificity: Math.round(
      average(skillScores.map((skill) => skill.score_factors?.evidence_quality || 0))
    ),
    recency: Math.round(average(skillScores.map((skill) => skill.score_factors?.recency || 0)))
  };

  let score = Math.round(
    factors.professional_impact * 0.2 +
      factors.role_complexity * 0.16 +
      factors.ownership * 0.18 +
      factors.technical_depth * 0.18 +
      factors.career_progression * 0.08 +
      factors.evidence_specificity * 0.14 +
      factors.recency * 0.06
  );

  if (factors.professional_impact < 45) {
    score = capScore(score, 68);
  }

  if (factors.ownership < 45) {
    score = capScore(score, 72);
  }

  if (factors.evidence_specificity < 45) {
    score = capScore(score, 58);
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    version: 1,
    score: normalizedScore,
    label: getProfileScoreLabel(normalizedScore),
    score_factors: factors,
    rationale:
      "Profile score estimated from extracted skill evidence because this candidate was saved before dedicated profile scoring.",
    strengths: skillScores.slice(0, 2).map((skill) => `${skill.name}: ${skill.evidence || skill.level}`),
    caveats: ["No job description was provided, so this is not a role match score."]
  };
};

const normalizeProfileScore = (candidate, skillScores, experienceTimeline) => {
  const profileScore =
    candidate.profile_score && typeof candidate.profile_score === "object"
      ? candidate.profile_score
      : {};

  if (
    profileScore.version === 1 &&
    typeof profileScore.score === "number" &&
    !Number.isNaN(profileScore.score)
  ) {
    const score = Math.max(0, Math.min(100, Math.round(profileScore.score)));

    return {
      version: 1,
      score,
      label:
        typeof profileScore.label === "string" && profileScore.label.trim()
          ? profileScore.label.trim()
          : getProfileScoreLabel(score),
      score_factors: normalizeProfileScoreFactors(profileScore.score_factors),
      rationale: typeof profileScore.rationale === "string" ? profileScore.rationale : "",
      strengths: normalizeStringList(profileScore.strengths),
      caveats: normalizeStringList(profileScore.caveats)
    };
  }

  return buildFallbackProfileScore(skillScores, experienceTimeline);
};

const normalizeCandidate = (candidate) => {
  const skillScores = normalizeSkillScores(candidate.skill_scores, candidate.extracted_skills);
  const experienceTimeline = normalizeTimeline(candidate.experience_timeline);

  return {
    ...candidate,
    name: formatCandidateName(candidate.name),
    email: candidate.email || NOT_AVAILABLE,
    extracted_skills: normalizeStringArray(candidate.extracted_skills),
    skill_scores: skillScores,
    profile_score: normalizeProfileScore(candidate, skillScores, experienceTimeline),
    experience_timeline: experienceTimeline
  };
};

export const parseResume = async ({ file }) => {
  const formData = new FormData();
  formData.append("resume", file);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/resumes/parse`, {
      method: "POST",
      body: formData
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const responseText = await response.text();
  let data = {};

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      responseText
        ? `Server returned a non-JSON response (${response.status}): ${responseText}`
        : "The server returned an empty non-JSON response."
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "Resume parsing failed.");
  }

  const normalizedCandidate = data.candidate ? normalizeCandidate(data.candidate) : data.candidate;

  return {
    ...data,
    candidate: normalizedCandidate,
    skills: normalizeStringArray(data.skills),
    skill_scores: normalizeSkillScores(data.skill_scores, data.skills),
    profile_score:
      normalizedCandidate?.profile_score ||
      normalizeProfileScore(data, normalizeSkillScores(data.skill_scores, data.skills), normalizeTimeline(data.experience_timeline)),
    experience_timeline: normalizeTimeline(data.experience_timeline)
  };
};

export const fetchParsedCandidates = async () => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/resumes/candidates`);
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const responseText = await response.text();
  let data = {};

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      responseText
        ? `Server returned a non-JSON response (${response.status}): ${responseText}`
        : "The server returned an empty non-JSON response."
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "Unable to load parsed candidates.");
  }

  return (data.candidates || []).map(normalizeCandidate);
};

export const deleteParsedCandidate = async (candidateId) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/resumes/candidates/${candidateId}`, {
      method: "DELETE"
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const responseText = await response.text();
  let data = {};

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      responseText
        ? `Server returned a non-JSON response (${response.status}): ${responseText}`
        : "The server returned an empty non-JSON response."
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "Unable to delete candidate.");
  }

  return data;
};
