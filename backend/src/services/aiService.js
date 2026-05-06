const buildResumePrompt = (resumeText) => `
You are an expert technical recruiter.

Analyze the resume text below and return only valid JSON.
The JSON shape must be:
{
  "candidate_name": "Candidate full name if present, otherwise Not available",
  "email": "Candidate email if present, otherwise Not available",
  "skills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "skill_scores": [
    {
      "name": "skill name",
      "score": 85,
      "evidence": "Short resume-based reason for this score"
    }
  ],
  "summary": "One sentence summary of the candidate.",
  "experience_timeline": [
    {
      "title": "Job title, degree, project, internship, or milestone",
      "company": "Company, school, or organization name if available",
      "period": "Date range or year if available",
      "detail": "Short resume-based description"
    }
  ]
}

Rules:
- Extract the candidate name and email from the resume text only.
- If the candidate name is missing, set candidate_name to "Not available".
- If the email address is missing, set email to "Not available".
- Include the candidate's top 5 technical skills in both skills and skill_scores.
- The skills array must contain the same skill names, in the same order, as skill_scores.
- Score each skill from 0 to 100 using only resume evidence.
- Use 90-100 for deep repeated professional use with ownership or leadership.
- Use 75-89 for strong practical job or major project usage.
- Use 55-74 for moderate usage with limited detail.
- Use 30-54 for mentioned skills with weak evidence.
- Do not include skills below 30 unless they are central to the resume.
- Keep evidence short and specific to what the resume says.
- Extract 3 to 5 real career or education milestones from the resume.
- Use only information present in the resume text for the timeline.
- If dates are missing, set period to "Not specified".
- If company or organization is missing, set company to "Not specified".
- Do not include markdown fences or commentary.
- Keep the summary to one sentence.

Resume text:
${resumeText}
`;

const resumeAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["candidate_name", "email", "skills", "skill_scores", "summary", "experience_timeline"],
  properties: {
    candidate_name: {
      type: "string"
    },
    email: {
      type: "string"
    },
    skills: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "string"
      }
    },
    skill_scores: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "score", "evidence"],
        properties: {
          name: {
            type: "string"
          },
          score: {
            type: "integer",
            minimum: 0,
            maximum: 100
          },
          evidence: {
            type: "string"
          }
        }
      }
    },
    summary: {
      type: "string"
    },
    experience_timeline: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "company", "period", "detail"],
        properties: {
          title: {
            type: "string"
          },
          company: {
            type: "string"
          },
          period: {
            type: "string"
          },
          detail: {
            type: "string"
          }
        }
      }
    }
  }
};

const getResponseText = (data) => {
  if (data.output_text) {
    return data.output_text;
  }

  return data.output
    ?.flatMap((item) => item.content || [])
    ?.find((contentItem) => contentItem.type === "output_text")
    ?.text;
};

const parseJsonFromModel = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    // Some models still wrap JSON in markdown. This extracts the first JSON object safely enough for API responses.
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("The AI response did not include valid JSON.");
    }

    return JSON.parse(jsonMatch[0]);
  }
};

const normalizeScore = (score) => {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
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
      .filter((skill) => skill && typeof skill === "object" && typeof skill.name === "string")
      .slice(0, 5)
      .map((skill) => {
        const score = normalizeScore(skill.score);

        return {
          name: skill.name.trim(),
          score,
          level: getScoreLevel(score),
          evidence: typeof skill.evidence === "string" ? skill.evidence : ""
        };
      })
      .filter((skill) => skill.name);
  }

  return [];
};

const normalizeAnalysis = (analysis) => {
  const skillScores = normalizeSkillScores(analysis.skill_scores, analysis.skills);
  const skillNames = skillScores.length
    ? skillScores.map((skill) => skill.name)
    : Array.isArray(analysis.skills)
      ? analysis.skills.filter((skill) => typeof skill === "string").slice(0, 5)
      : [];

  return {
    candidate_name: typeof analysis.candidate_name === "string" ? analysis.candidate_name : "",
    email: typeof analysis.email === "string" ? analysis.email : "",
    skills: skillNames,
    skill_scores: skillScores,
    summary: typeof analysis.summary === "string" ? analysis.summary : "",
    experience_timeline: Array.isArray(analysis.experience_timeline)
      ? analysis.experience_timeline
          .filter((item) => item && typeof item === "object")
          .slice(0, 5)
          .map((item) => ({
            title: typeof item.title === "string" ? item.title : "Milestone",
            company: typeof item.company === "string" ? item.company : "Not specified",
            period: typeof item.period === "string" ? item.period : "Not specified",
            detail: typeof item.detail === "string" ? item.detail : "No detail available."
          }))
      : []
  };
};

const getProviderErrorMessage = async (response, providerName) => {
  const errorBody = await response.text();

  try {
    const parsedError = JSON.parse(errorBody);
    const code = parsedError.error?.code;
    const message = parsedError.error?.message;

    if (code === "insufficient_quota") {
      return `${providerName} quota is exhausted. Add billing credits or increase the project monthly limit, then retry. For classroom demos, set LLM_PROVIDER=mock in backend/.env.`;
    }

    return `${providerName} request failed: ${message || errorBody}`;
  } catch {
    return `${providerName} request failed: ${errorBody}`;
  }
};

const getProviderTimeoutSignal = () => AbortSignal.timeout(25_000);

const analyzeWithMock = async (resumeText) => {
  const commonSkillKeywords = [
    "React",
    "Node.js",
    "MongoDB",
    "Express",
    "JavaScript",
    "TypeScript",
    "Python",
    "AWS",
    "Docker",
    "SQL"
  ];

  const lowerResumeText = resumeText.toLowerCase();
  const detectedSkills = commonSkillKeywords.filter((skill) =>
    lowerResumeText.includes(skill.toLowerCase())
  );

  const skills = [...new Set([...detectedSkills, "JavaScript", "Node.js", "React", "MongoDB", "REST APIs"])].slice(0, 5);

  return {
    candidate_name: "Not available",
    email: "Not available",
    skills,
    skill_scores: skills.map((skill, index) => ({
      name: skill,
      score: Math.min(88, 68 + index * 4),
      level: getScoreLevel(Math.min(88, 68 + index * 4)),
      evidence: "Mock provider generated this score because no live LLM analysis is active."
    })),
    summary: "Mock analysis: this candidate appears to have practical full-stack development experience.",
    experience_timeline: [
      {
        title: "Resume Uploaded",
        company: "IntelliHire Demo",
        period: "Now",
        detail: "Mock provider is active, so timeline data is illustrative rather than AI-extracted."
      },
      {
        title: "Technical Profile Identified",
        company: "IntelliHire Demo",
        period: "AI Review",
        detail: `Detected skills include ${skills.slice(0, 3).join(", ")}.`
      }
    ]
  };
};

const analyzeWithOpenAI = async (resumeText) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when LLM_PROVIDER=openai.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: getProviderTimeoutSignal(),
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      store: false,
      input: [
        {
          role: "system",
          content: "Return structured recruiting insights as strict JSON."
        },
        {
          role: "user",
          content: buildResumePrompt(resumeText)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resume_analysis",
          schema: resumeAnalysisSchema,
          strict: true
        }
      },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(await getProviderErrorMessage(response, "OpenAI"));
  }

  const data = await response.json();
  const content = getResponseText(data);

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return normalizeAnalysis(parseJsonFromModel(content));
};

const analyzeWithGemini = async (resumeText) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required when LLM_PROVIDER=gemini.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      signal: getProviderTimeoutSignal(),
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildResumePrompt(resumeText) }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(await getProviderErrorMessage(response, "Gemini"));
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("Gemini returned an empty response.");
  }

  return normalizeAnalysis(parseJsonFromModel(content));
};

export const analyzeResumeText = async (resumeText) => {
  if (!resumeText || resumeText.trim().length < 20) {
    throw new Error("Resume text is too short to analyze.");
  }

  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();

  if (provider === "mock") {
    return analyzeWithMock(resumeText);
  }

  try {
    if (provider === "gemini") {
      return await analyzeWithGemini(resumeText);
    }

    return await analyzeWithOpenAI(resumeText);
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new Error("AI provider timed out. Please retry with a smaller resume PDF.");
    }

    throw error;
  }
};
