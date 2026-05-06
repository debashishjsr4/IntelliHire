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

const normalizeSkillScores = (skillScores, skills) => {
  if (Array.isArray(skillScores) && skillScores.length) {
    return skillScores
      .filter((skill) => skill && typeof skill.name === "string")
      .slice(0, 5)
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
          evidence: typeof skill.evidence === "string" ? skill.evidence : ""
        };
      })
      .filter((skill) => skill.name);
  }

  return normalizeStringArray(skills)
    .slice(0, 5)
    .map((skill, index) => {
      const score = getSkillStrength(skill, index);

      return {
        name: skill,
        score,
        level: getScoreLevel(score),
        evidence: ""
      };
    });
};

const normalizeCandidate = (candidate) => ({
  ...candidate,
  name: formatCandidateName(candidate.name),
  email: candidate.email || NOT_AVAILABLE,
  extracted_skills: normalizeStringArray(candidate.extracted_skills),
  skill_scores: normalizeSkillScores(candidate.skill_scores, candidate.extracted_skills),
  experience_timeline: normalizeTimeline(candidate.experience_timeline)
});

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

  return {
    ...data,
    candidate: data.candidate ? normalizeCandidate(data.candidate) : data.candidate,
    skills: normalizeStringArray(data.skills),
    skill_scores: normalizeSkillScores(data.skill_scores, data.skills),
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
