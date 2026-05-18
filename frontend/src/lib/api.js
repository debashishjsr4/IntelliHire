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

const normalizeJobMatch = (match) => {
  const source = match && typeof match === "object" ? match : {};
  const score =
    typeof source.score === "number"
      ? Math.max(0, Math.min(100, Math.round(source.score)))
      : 0;

  return {
    ...source,
    score,
    label: typeof source.label === "string" && source.label.trim() ? source.label : "Partial Match",
    rationale: typeof source.rationale === "string" ? source.rationale : "",
    matched_requirements: normalizeStringArray(source.matched_requirements),
    missing_requirements: normalizeStringArray(source.missing_requirements),
    concerns: normalizeStringArray(source.concerns),
    interview_focus: normalizeStringArray(source.interview_focus)
  };
};

const normalizeJobDescription = (jobDescription) => ({
  ...jobDescription,
  title: jobDescription.title || "Untitled role",
  summary: jobDescription.summary || "",
  must_have_skills: normalizeStringArray(jobDescription.must_have_skills),
  nice_to_have_skills: normalizeStringArray(jobDescription.nice_to_have_skills),
  responsibilities: normalizeStringArray(jobDescription.responsibilities),
  seniority_level: jobDescription.seniority_level || "Not specified",
  domain_context: jobDescription.domain_context || "Not specified",
  required_experience: jobDescription.required_experience || "Not specified",
  experience_requirements: normalizeStringArray(jobDescription.experience_requirements),
  education_requirements: normalizeStringArray(jobDescription.education_requirements),
  role_metadata: Array.isArray(jobDescription.role_metadata)
    ? jobDescription.role_metadata
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          label: typeof item.label === "string" ? item.label : "",
          value: typeof item.value === "string" ? item.value : ""
        }))
        .filter((item) => item.label && item.value)
    : [],
  source_notes: normalizeStringArray(jobDescription.source_notes),
  additional_sections: Array.isArray(jobDescription.additional_sections)
    ? jobDescription.additional_sections
        .filter((section) => section && typeof section === "object")
        .map((section) => ({
          title: typeof section.title === "string" ? section.title : "",
          items: normalizeStringArray(section.items)
        }))
        .filter((section) => section.title && section.items.length)
    : [],
  evaluation_criteria: normalizeStringArray(jobDescription.evaluation_criteria)
});

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
    job_matches: Array.isArray(candidate.job_matches)
      ? candidate.job_matches.map(normalizeJobMatch)
      : [],
    experience_timeline: experienceTimeline
  };
};

const parseApiResponse = async (response, fallbackMessage) => {
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
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

export const loginUser = async ({ password, userId }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password, userId })
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  return parseApiResponse(response, "Login failed.");
};

export const fetchCurrentUser = async ({ userId }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/session`, {
      headers: {
        "x-user-id": userId
      }
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  return parseApiResponse(response, "Unable to refresh user session.");
};

export const changeOwnPassword = async ({ currentPassword, newPassword, userId }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  return parseApiResponse(response, "Unable to change password.");
};

export const parseResume = async ({ file, jobDescriptionId = "" }) => {
  const formData = new FormData();
  formData.append("resume", file);

  if (jobDescriptionId) {
    formData.append("job_description_id", jobDescriptionId);
  }

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

  const data = await parseApiResponse(response, "Resume parsing failed.");

  const normalizedCandidate = data.candidate ? normalizeCandidate(data.candidate) : data.candidate;

  return {
    ...data,
    candidate: normalizedCandidate,
    skills: normalizeStringArray(data.skills),
    skill_scores: normalizeSkillScores(data.skill_scores, data.skills),
    job_matches: Array.isArray(data.job_matches) ? data.job_matches.map(normalizeJobMatch) : [],
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

  const data = await parseApiResponse(response, "Unable to load parsed candidates.");

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

  return parseApiResponse(response, "Unable to delete candidate.");
};

export const deleteCandidateJobMatch = async ({ candidateId, jobDescriptionId }) => {
  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/resumes/candidates/${candidateId}/job-matches/${jobDescriptionId}`,
      {
        method: "DELETE"
      }
    );
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const data = await parseApiResponse(response, "Unable to delete saved job match.");

  return {
    ...data,
    candidate: data.candidate ? normalizeCandidate(data.candidate) : null
  };
};

export const fetchJobDescriptions = async () => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs`);
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const data = await parseApiResponse(response, "Unable to load job descriptions.");

  return (data.jobDescriptions || []).map(normalizeJobDescription);
};

export const uploadJobDescription = async ({ file }) => {
  const formData = new FormData();
  formData.append("jobDescription", file);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/upload`, {
      method: "POST",
      body: formData
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const data = await parseApiResponse(response, "Job description upload failed.");

  return normalizeJobDescription(data.jobDescription);
};

export const createJobDescriptionFromText = async ({ sourceName, text }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sourceName, text })
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const data = await parseApiResponse(response, "Job description creation failed.");

  return normalizeJobDescription(data.jobDescription);
};

export const updateJobDescriptionTitle = async ({ jobDescriptionId, title }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/${jobDescriptionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title })
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const data = await parseApiResponse(response, "Unable to update job description name.");

  return normalizeJobDescription(data.jobDescription);
};

export const deleteJobDescription = async (jobDescriptionId) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/${jobDescriptionId}`, {
      method: "DELETE"
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  return parseApiResponse(response, "Unable to delete job description.");
};

export const matchJobCandidates = async (jobDescriptionId) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/${jobDescriptionId}/match-candidates`, {
      method: "POST"
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const data = await parseApiResponse(response, "Unable to match candidates.");

  return {
    matchedCount: data.matchedCount || 0,
    candidates: (data.candidates || []).map(normalizeCandidate)
  };
};

export const fetchJobCandidateShortlist = async ({ jobDescriptionId, limit = 10 }) => {
  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/jobs/${jobDescriptionId}/shortlist?limit=${encodeURIComponent(limit)}`
    );
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const data = await parseApiResponse(response, "Unable to shortlist candidates.");

  return (data.shortlist || []).map((item) => ({
    ...item,
    candidate: normalizeCandidate(item.candidate),
    matched_requirements: normalizeStringArray(item.matched_requirements),
    missing_requirements: normalizeStringArray(item.missing_requirements),
    shortlist_score:
      typeof item.shortlist_score === "number"
        ? Math.max(0, Math.min(100, Math.round(item.shortlist_score)))
        : 0
  }));
};

export const matchSelectedJobCandidates = async ({ candidateIds, jobDescriptionId }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/${jobDescriptionId}/match-selected`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ candidate_ids: candidateIds })
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const data = await parseApiResponse(response, "Unable to match selected candidates.");

  return {
    matchedCount: data.matchedCount || 0,
    candidates: (data.candidates || []).map(normalizeCandidate)
  };
};

export const fetchUsers = async ({ userId }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: {
        "x-user-id": userId
      }
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  return parseApiResponse(response, "Unable to load users.");
};

export const createUser = async ({ password, role, requestingUserId, userId }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": requestingUserId
      },
      body: JSON.stringify({ password, role, userId })
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  return parseApiResponse(response, "Unable to create user.");
};

export const updateUser = async ({
  isLocked,
  newUserId,
  password,
  requestingUserId,
  role,
  userId
}) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": requestingUserId
      },
      body: JSON.stringify({ isLocked, newUserId, password, role })
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  return parseApiResponse(response, "Unable to update user.");
};

export const deleteUser = async ({ requestingUserId, userId }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: {
        "x-user-id": requestingUserId
      }
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  return parseApiResponse(response, "Unable to delete user.");
};
