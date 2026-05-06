const buildResumePrompt = (resumeText) => `
You are an expert technical recruiter.

Analyze the resume text below and return only valid JSON.
The JSON shape must be:
{
  "candidate_name": "Candidate full name if present, otherwise Not available",
  "email": "Candidate email if present, otherwise Not available",
  "skills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5", "skill 6"],
  "skill_scores": [
    {
      "name": "skill name",
      "score": 85,
      "score_factors": {
        "direct_application": 70,
        "complexity": 60,
        "ownership": 50,
        "impact": 40,
        "recency": 70,
        "evidence_quality": 60
      },
      "evidence": "Short resume-based reason for this score"
    }
  ],
  "profile_score": {
    "score": 72,
    "label": "Solid",
    "score_factors": {
      "professional_impact": 55,
      "role_complexity": 60,
      "ownership": 50,
      "technical_depth": 65,
      "career_progression": 50,
      "evidence_specificity": 60,
      "recency": 70
    },
    "rationale": "Short resume-based explanation of how strong the candidate appears.",
    "strengths": ["Specific strength from the CV"],
    "caveats": ["Specific limitation or uncertainty from the CV"]
  },
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
- Include 5 to 10 technical skills in both skills and skill_scores when available.
- The skills array must contain the same skill names, in the same order, as skill_scores.
- Do not include only strengths. Include a balanced skill profile:
  - 4 to 6 primary skills with the best evidence.
  - 1 to 3 moderate skills with some evidence.
  - Up to 3 weakly supported skills explicitly mentioned in the CV, even if they score as low as 20-40.
- Include low-score skills when they are explicitly mentioned but not substantiated, because recruiters need to distinguish mentions from strengths.
- Order skill_scores by score descending after applying evidence caps.
- Score each skill from 0 to 100 using only explicit resume evidence. Be skeptical and evidence-first.
- Do not infer mastery from a skills list, keyword stuffing, certifications, training, or generic claims.
- For each skill, first score these factors from 0 to 100:
  - direct_application: whether the CV shows the candidate actually used the skill to deliver work.
  - complexity: whether the work involved non-trivial implementation, design, debugging, migration, scaling, integration, architecture, or domain complexity.
  - ownership: whether the candidate personally owned delivery, decisions, design, production support, or leadership for the skill.
  - impact: whether the CV shows measurable or business/user impact, production outcomes, efficiency gains, revenue/cost impact, reliability, or adoption.
  - recency: whether the skill was used recently in real work, not only old/academic/training contexts.
  - evidence_quality: how specific and credible the CV evidence is for this exact skill.
- The final score should be approximately:
  direct_application 30%, complexity 20%, ownership 20%, impact 15%, recency 10%, evidence_quality 5%.
- Apply caps after estimating the weighted score:
  - If the skill only appears in a skills/tools list, cap at 45.
  - If the CV only says "worked with", "exposure to", "familiar with", or similar vague phrasing, cap at 55.
  - If there is one project or role mention but no detail about what the candidate built or owned, cap at 60.
  - If the candidate used the skill but with limited scope, unclear ownership, or no outcomes, cap at 70.
  - If there is no measurable impact or production/business outcome, cap at 78.
  - If individual ownership is unclear, cap at 75.
  - If direct exposure appears to be around 2 years or less, cap at 70 unless there is unusually strong project ownership and concrete impact.
  - If direct exposure appears to be around 1 year or less, cap at 60 unless there is unusually strong evidence.
  - Do not score above 85 unless the CV shows substantial direct application, complex work, clear ownership, and impact.
  - Do not score above 90 unless the CV shows exceptional evidence: architecture/strategy leadership, repeated delivery, recent use, and concrete outcomes.
- Most CVs should have no skills above 85. A 95+ score should be extremely rare.
- Do not give more than one skill above 85 unless the CV is genuinely exceptional for multiple skills.
- Evidence text must briefly explain the main positive evidence and the main limiting factor.
- Keep evidence short and specific to what the resume says.
- Also score profile_score from 0 to 100 as the candidate's overall professional strength based only on CV claims.
- profile_score is not a job match score and must not assume a specific job description.
- profile_score means: if a role matches this candidate's actual area of experience, how strong does the candidate look from the CV evidence?
- For profile_score, score these factors from 0 to 100:
  - professional_impact: measurable outcomes, business/user value, delivery results, awards, or exceptional achievements.
  - role_complexity: difficulty of roles, systems, projects, domain, scale, ambiguity, or responsibility.
  - ownership: individual accountability, leadership, decision-making, mentoring, production ownership, or end-to-end delivery.
  - technical_depth: depth of practical expertise in the candidate's stated area, not breadth of keywords.
  - career_progression: growth in scope, responsibility, seniority, or quality of work over time.
  - evidence_specificity: how concrete and credible the CV evidence is, including numbers, scope, outcomes, and named work.
  - recency: whether the strongest evidence is recent and professionally relevant.
- Calculate profile_score approximately from those factors, with professional_impact, ownership, role_complexity, technical_depth, and evidence_specificity carrying the most weight.
- Apply conservative profile_score caps:
  - If the CV is mostly responsibilities with no outcomes or achievements, cap profile_score at 68.
  - If impact is vague or unmeasured, cap profile_score at 75.
  - If ownership is unclear, cap profile_score at 72.
  - If the candidate appears junior or has narrow exposure, cap profile_score at 65 unless there are unusually strong achievements.
  - If evidence is mostly keyword lists or generic claims, cap profile_score at 58.
  - Do not score above 85 unless the CV shows clear ownership, complex work, strong depth, and concrete impact.
  - Do not score above 90 unless the CV shows exceptional achievements, repeated high-impact delivery, or unusually strong professional success.
- Most candidates should be between 45 and 78. 90+ should be rare.
- profile_score label must be one of: "Emerging", "Solid", "Strong", "Exceptional".
- profile_score strengths and caveats must be grounded only in the resume text.
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
  required: [
    "candidate_name",
    "email",
    "skills",
    "skill_scores",
    "profile_score",
    "summary",
    "experience_timeline"
  ],
  properties: {
    candidate_name: {
      type: "string"
    },
    email: {
      type: "string"
    },
    skills: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: {
        type: "string"
      }
    },
    skill_scores: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "score", "score_factors", "evidence"],
        properties: {
          name: {
            type: "string"
          },
          score: {
            type: "integer",
            minimum: 0,
            maximum: 100
          },
          score_factors: {
            type: "object",
            additionalProperties: false,
            required: [
              "direct_application",
              "complexity",
              "ownership",
              "impact",
              "recency",
              "evidence_quality"
            ],
            properties: {
              direct_application: {
                type: "integer",
                minimum: 0,
                maximum: 100
              },
              complexity: {
                type: "integer",
                minimum: 0,
                maximum: 100
              },
              ownership: {
                type: "integer",
                minimum: 0,
                maximum: 100
              },
              impact: {
                type: "integer",
                minimum: 0,
                maximum: 100
              },
              recency: {
                type: "integer",
                minimum: 0,
                maximum: 100
              },
              evidence_quality: {
                type: "integer",
                minimum: 0,
                maximum: 100
              }
            }
          },
          evidence: {
            type: "string"
          }
        }
      }
    },
    profile_score: {
      type: "object",
      additionalProperties: false,
      required: ["score", "label", "score_factors", "rationale", "strengths", "caveats"],
      properties: {
        score: {
          type: "integer",
          minimum: 0,
          maximum: 100
        },
        label: {
          type: "string",
          enum: ["Emerging", "Solid", "Strong", "Exceptional"]
        },
        score_factors: {
          type: "object",
          additionalProperties: false,
          required: [
            "professional_impact",
            "role_complexity",
            "ownership",
            "technical_depth",
            "career_progression",
            "evidence_specificity",
            "recency"
          ],
          properties: {
            professional_impact: {
              type: "integer",
              minimum: 0,
              maximum: 100
            },
            role_complexity: {
              type: "integer",
              minimum: 0,
              maximum: 100
            },
            ownership: {
              type: "integer",
              minimum: 0,
              maximum: 100
            },
            technical_depth: {
              type: "integer",
              minimum: 0,
              maximum: 100
            },
            career_progression: {
              type: "integer",
              minimum: 0,
              maximum: 100
            },
            evidence_specificity: {
              type: "integer",
              minimum: 0,
              maximum: 100
            },
            recency: {
              type: "integer",
              minimum: 0,
              maximum: 100
            }
          }
        },
        rationale: {
          type: "string"
        },
        strengths: {
          type: "array",
          minItems: 0,
          maxItems: 4,
          items: {
            type: "string"
          }
        },
        caveats: {
          type: "array",
          minItems: 0,
          maxItems: 4,
          items: {
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

const normalizeScoreFactors = (scoreFactors) => {
  const source = scoreFactors && typeof scoreFactors === "object" ? scoreFactors : {};

  return {
    direct_application: normalizeScore(source.direct_application),
    complexity: normalizeScore(source.complexity),
    ownership: normalizeScore(source.ownership),
    impact: normalizeScore(source.impact),
    recency: normalizeScore(source.recency),
    evidence_quality: normalizeScore(source.evidence_quality)
  };
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

const normalizeProfileScoreFactors = (scoreFactors) => {
  const source = scoreFactors && typeof scoreFactors === "object" ? scoreFactors : {};

  return {
    professional_impact: normalizeScore(source.professional_impact),
    role_complexity: normalizeScore(source.role_complexity),
    ownership: normalizeScore(source.ownership),
    technical_depth: normalizeScore(source.technical_depth),
    career_progression: normalizeScore(source.career_progression),
    evidence_specificity: normalizeScore(source.evidence_specificity),
    recency: normalizeScore(source.recency)
  };
};

const normalizeStringList = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
    : [];

const normalizeProfileScore = (profileScore) => {
  const source = profileScore && typeof profileScore === "object" ? profileScore : {};
  const score = normalizeScore(source.score);
  const label =
    typeof source.label === "string" &&
    ["Emerging", "Solid", "Strong", "Exceptional"].includes(source.label)
      ? source.label
      : getProfileScoreLabel(score);

  return {
    version: 1,
    score,
    label,
    score_factors: normalizeProfileScoreFactors(source.score_factors),
    rationale: typeof source.rationale === "string" ? source.rationale : "",
    strengths: normalizeStringList(source.strengths),
    caveats: normalizeStringList(source.caveats)
  };
};

const normalizeSkillScores = (skillScores, skills) => {
  if (Array.isArray(skillScores) && skillScores.length) {
    return skillScores
      .filter((skill) => skill && typeof skill === "object" && typeof skill.name === "string")
      .slice(0, 10)
      .map((skill) => {
        const score = normalizeScore(skill.score);

        return {
          name: skill.name.trim(),
          score,
          level: getScoreLevel(score),
          score_factors: normalizeScoreFactors(skill.score_factors),
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
      ? analysis.skills.filter((skill) => typeof skill === "string").slice(0, 10)
      : [];

  return {
    candidate_name: typeof analysis.candidate_name === "string" ? analysis.candidate_name : "",
    email: typeof analysis.email === "string" ? analysis.email : "",
    skills: skillNames,
    skill_scores: skillScores,
    profile_score: normalizeProfileScore(analysis.profile_score),
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
    const status = parsedError.error?.status;

    if (
      response.status === 429 ||
      code === "insufficient_quota" ||
      status === "RESOURCE_EXHAUSTED" ||
      /quota|rate limit/i.test(message || "")
    ) {
      return `${providerName} quota is exhausted. Add billing credits or increase the provider quota, then retry. For demos, set LLM_FALLBACK_PROVIDER=mock or switch LLM_PROVIDER=mock.`;
    }

    return `${providerName} request failed: ${message || errorBody}`;
  } catch {
    return `${providerName} request failed: ${errorBody}`;
  }
};

const isQuotaError = (error) => /quota is exhausted|quota exceeded|rate limit/i.test(error.message || "");

const getProviderTimeoutSignal = () => {
  const configuredTimeout = Number.parseInt(process.env.LLM_TIMEOUT_MS || "", 10);
  const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 50_000;

  return AbortSignal.timeout(Math.min(timeoutMs, 55_000));
};

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

  const skills = [
    ...new Set([
      ...detectedSkills,
      "JavaScript",
      "Node.js",
      "React",
      "MongoDB",
      "REST APIs",
      "SQL",
      "Docker"
    ])
  ].slice(0, 8);

  return {
    candidate_name: "Not available",
    email: "Not available",
    skills,
    skill_scores: skills.map((skill, index) => ({
      name: skill,
      score: Math.min(76, 52 + index * 6),
      level: getScoreLevel(Math.min(76, 52 + index * 6)),
      score_factors: {
        direct_application: Math.min(76, 52 + index * 6),
        complexity: 45,
        ownership: 40,
        impact: 30,
        recency: 50,
        evidence_quality: 35
      },
      evidence: "Mock provider generated this score because no live LLM analysis is active."
    })),
    profile_score: {
      version: 1,
      score: 58,
      label: "Solid",
      score_factors: {
        professional_impact: 40,
        role_complexity: 50,
        ownership: 45,
        technical_depth: 58,
        career_progression: 45,
        evidence_specificity: 35,
        recency: 55
      },
      rationale: "Mock provider uses a conservative default profile score because no live LLM analysis is active.",
      strengths: ["Detected technical skills in the uploaded text."],
      caveats: ["Mock mode cannot verify achievements, ownership, or measurable impact."]
    },
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

const analyzeWithProvider = async (provider, resumeText) => {
  if (provider === "mock") {
    return analyzeWithMock(resumeText);
  }

  if (provider === "gemini") {
    return analyzeWithGemini(resumeText);
  }

  if (provider === "openai") {
    return analyzeWithOpenAI(resumeText);
  }

  throw new Error(`Unsupported LLM_PROVIDER "${provider}". Use "openai", "gemini", or "mock".`);
};

export const analyzeResumeText = async (resumeText) => {
  if (!resumeText || resumeText.trim().length < 20) {
    throw new Error("Resume text is too short to analyze.");
  }

  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  const fallbackProvider = (process.env.LLM_FALLBACK_PROVIDER || "").toLowerCase();

  try {
    return await analyzeWithProvider(provider, resumeText);
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new Error("AI provider timed out. Please retry with a smaller resume PDF.");
    }

    if (
      fallbackProvider &&
      fallbackProvider !== provider &&
      isQuotaError(error)
    ) {
      return analyzeWithProvider(fallbackProvider, resumeText);
    }

    throw error;
  }
};
