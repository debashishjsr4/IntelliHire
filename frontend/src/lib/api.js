const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");

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

const normalizeCandidate = (candidate) => ({
  ...candidate,
  extracted_skills: normalizeStringArray(candidate.extracted_skills),
  experience_timeline: normalizeTimeline(candidate.experience_timeline)
});

export const parseResume = async ({ file, name, email }) => {
  const formData = new FormData();
  formData.append("resume", file);

  if (name) {
    formData.append("name", name);
  }

  if (email) {
    formData.append("email", email);
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
