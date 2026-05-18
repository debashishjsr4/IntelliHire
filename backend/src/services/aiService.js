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

const buildJobDescriptionPrompt = (jobText) => `
You are an expert technical recruiter.

Analyze the job description text below and return only valid JSON.
The document may use any format, title, or section names. Normalize the requirements into this shape:
{
  "title": "Role title if present, otherwise Untitled role",
  "summary": "One sentence summary of the role.",
  "must_have_skills": ["required skill or capability"],
  "nice_to_have_skills": ["preferred skill or capability"],
  "responsibilities": ["main responsibility"],
  "seniority_level": "Junior, Mid, Senior, Lead, Manager, or Not specified",
  "domain_context": "Industry, product, team, or business context if present",
  "required_experience": "Experience requirement if present, otherwise Not specified",
  "experience_requirements": ["explicit experience requirement"],
  "education_requirements": ["degree, certification, or education requirement"],
  "role_metadata": [{"label": "Role Category", "value": "Software Development"}],
  "source_notes": ["disclaimer, source caveat, or content freshness note"],
  "additional_sections": [{"title": "Original or meaningful section name", "items": ["normalized item"]}],
  "evaluation_criteria": ["what a candidate should be evaluated on"]
}

Rules:
- Use only information present in the job description.
- If the document has unusual headings, infer the intent of the section rather than relying on section names.
- Map headings such as Education, Experience, Knowledge Skills and Abilities, Key Skills, Role, Industry Type, Department, Employment Type, Role Category, or Disclaimer into the most relevant fields above.
- Split merged portal keywords when possible, for example "Computer scienceAnalytical skillsApplication design" should become separate skills.
- Put hard requirements, required abilities, key skills, required knowledge, language requirements, and mandatory tools in must_have_skills.
- Separate must-have requirements from nice-to-have requirements.
- Put job duties and numbered work items in responsibilities.
- Put degree requirements in education_requirements.
- Put years/domain/application design/front-end/back-end experience requirements in experience_requirements and summarize them in required_experience.
- Put administrative portal metadata such as industry, department, employment type, role category, UG, and PG in role_metadata.
- Ignore low-value legal disclaimers for matching, but include a short note in source_notes if present.
- Preserve unusual but meaningful sections in additional_sections only when they do not fit the normalized fields.
- Keep list items concise and recruiter-friendly.
- Do not include markdown fences or commentary.

Job description text:
${jobText}
`;

const jobDescriptionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "must_have_skills",
    "nice_to_have_skills",
    "responsibilities",
    "seniority_level",
    "domain_context",
    "required_experience",
    "experience_requirements",
    "education_requirements",
    "role_metadata",
    "source_notes",
    "additional_sections",
    "evaluation_criteria"
  ],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    must_have_skills: {
      type: "array",
      minItems: 0,
      maxItems: 12,
      items: { type: "string" }
    },
    nice_to_have_skills: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: { type: "string" }
    },
    responsibilities: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: { type: "string" }
    },
    seniority_level: { type: "string" },
    domain_context: { type: "string" },
    required_experience: { type: "string" },
    experience_requirements: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    education_requirements: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    role_metadata: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value"],
        properties: {
          label: { type: "string" },
          value: { type: "string" }
        }
      }
    },
    source_notes: {
      type: "array",
      minItems: 0,
      maxItems: 4,
      items: { type: "string" }
    },
    additional_sections: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "items"],
        properties: {
          title: { type: "string" },
          items: {
            type: "array",
            minItems: 0,
            maxItems: 8,
            items: { type: "string" }
          }
        }
      }
    },
    evaluation_criteria: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: { type: "string" }
    }
  }
};

const buildJobMatchPrompt = ({ candidate, jobDescription }) => `
You are an expert technical recruiter.

Compare the candidate profile against the job requirements and return only valid JSON:
{
  "score": 74,
  "label": "Good Match",
  "rationale": "Short reason grounded in the candidate CV and job requirements.",
  "matched_requirements": ["requirement the candidate satisfies"],
  "missing_requirements": ["important requirement not evidenced"],
  "concerns": ["risk or uncertainty"],
  "interview_focus": ["topic to validate in interview"]
}

Meaning:
- This is a Job Match Score, not the candidate's general Profile Score.
- Score how well this CV evidence fits this specific job description.
- Prioritize must-have requirements, relevant professional evidence, seniority fit, domain fit, and recency.
- Penalize missing critical requirements even if the candidate has a strong general profile.
- Use conservative scoring. Do not infer fit from keywords without evidence.
- Label must be one of: "Poor Match", "Weak Match", "Partial Match", "Good Match", "Excellent Match".
- 85-100 Excellent Match: most must-haves are strongly evidenced and seniority/domain fit is clear.
- 70-84 Good Match: important requirements are covered, with manageable gaps.
- 55-69 Partial Match: some alignment, but notable missing evidence.
- 35-54 Weak Match: limited alignment.
- 0-34 Poor Match: little relevant evidence.

Job description:
${JSON.stringify(jobDescription, null, 2)}

Candidate profile:
${JSON.stringify(candidate, null, 2)}
`;

const jobMatchSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "score",
    "label",
    "rationale",
    "matched_requirements",
    "missing_requirements",
    "concerns",
    "interview_focus"
  ],
  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100
    },
    label: {
      type: "string",
      enum: ["Poor Match", "Weak Match", "Partial Match", "Good Match", "Excellent Match"]
    },
    rationale: { type: "string" },
    matched_requirements: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    missing_requirements: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    concerns: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: { type: "string" }
    },
    interview_focus: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: { type: "string" }
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

const requestOpenAIJson = async ({ prompt, schema, schemaName }) => {
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
          content: prompt
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
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

  return parseJsonFromModel(content);
};

const requestGeminiJson = async (prompt) => {
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
            parts: [{ text: prompt }]
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

  return parseJsonFromModel(content);
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

const normalizeList = (value, maxItems = 8) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, maxItems)
    : [];

const normalizeLabelValueList = (value, maxItems = 8) =>
  Array.isArray(value)
    ? value
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          label: typeof item.label === "string" ? item.label.trim() : "",
          value: typeof item.value === "string" ? item.value.trim() : ""
        }))
        .filter((item) => item.label && item.value)
        .slice(0, maxItems)
    : [];

const normalizeFlexibleSections = (value, maxItems = 6) =>
  Array.isArray(value)
    ? value
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          title: typeof item.title === "string" ? item.title.trim() : "",
          items: normalizeList(item.items, 8)
        }))
        .filter((item) => item.title && item.items.length)
        .slice(0, maxItems)
    : [];

const normalizeJobDescription = (analysis) => ({
  title:
    typeof analysis.title === "string" && analysis.title.trim()
      ? analysis.title.trim()
      : "Untitled role",
  summary: typeof analysis.summary === "string" ? analysis.summary : "",
  must_have_skills: normalizeList(analysis.must_have_skills, 12),
  nice_to_have_skills: normalizeList(analysis.nice_to_have_skills, 10),
  responsibilities: normalizeList(analysis.responsibilities, 10),
  seniority_level:
    typeof analysis.seniority_level === "string" && analysis.seniority_level.trim()
      ? analysis.seniority_level.trim()
      : "Not specified",
  domain_context:
    typeof analysis.domain_context === "string" && analysis.domain_context.trim()
      ? analysis.domain_context.trim()
      : "Not specified",
  required_experience:
    typeof analysis.required_experience === "string" && analysis.required_experience.trim()
      ? analysis.required_experience.trim()
      : "Not specified",
  experience_requirements: normalizeList(analysis.experience_requirements, 8),
  education_requirements: normalizeList(analysis.education_requirements, 8),
  role_metadata: normalizeLabelValueList(analysis.role_metadata, 10),
  source_notes: normalizeList(analysis.source_notes, 4),
  additional_sections: normalizeFlexibleSections(analysis.additional_sections, 6),
  evaluation_criteria: normalizeList(analysis.evaluation_criteria, 10)
});

const getJobMatchLabel = (score) => {
  if (score >= 85) {
    return "Excellent Match";
  }

  if (score >= 70) {
    return "Good Match";
  }

  if (score >= 55) {
    return "Partial Match";
  }

  if (score >= 35) {
    return "Weak Match";
  }

  return "Poor Match";
};

export const normalizeJobMatch = (match) => {
  const source = match && typeof match === "object" ? match : {};
  const score = normalizeScore(source.score);

  return {
    score,
    label:
      typeof source.label === "string" && source.label.trim()
        ? source.label.trim()
        : getJobMatchLabel(score),
    rationale: typeof source.rationale === "string" ? source.rationale : "",
    matched_requirements: normalizeList(source.matched_requirements, 8),
    missing_requirements: normalizeList(source.missing_requirements, 8),
    concerns: normalizeList(source.concerns, 5),
    interview_focus: normalizeList(source.interview_focus, 5)
  };
};

const buildMockJobDescription = (jobText) => {
  const lowerText = jobText.toLowerCase();
  const possibleSkills = [
    "React",
    "Node.js",
    "MongoDB",
    "JavaScript",
    "TypeScript",
    "Python",
    "AWS",
    "Docker",
    "SQL",
    "REST APIs"
  ];
  const detectedSkills = possibleSkills.filter((skill) => lowerText.includes(skill.toLowerCase()));

  return {
    title: "Uploaded Job Description",
    summary: "Mock analysis extracted a generalized technical role profile.",
    must_have_skills: detectedSkills.slice(0, 5),
    nice_to_have_skills: detectedSkills.slice(5, 8),
    responsibilities: ["Deliver software features", "Collaborate with stakeholders"],
    seniority_level: lowerText.includes("senior") ? "Senior" : "Not specified",
    domain_context: "Not specified",
    required_experience: "Not specified",
    experience_requirements: [],
    education_requirements: [],
    role_metadata: [],
    source_notes: [],
    additional_sections: [],
    evaluation_criteria: ["Relevant technical evidence", "Ownership", "Impact"]
  };
};

const buildMockJobMatch = ({ candidate, jobDescription }) => {
  const candidateSkillNames = (candidate.skill_scores || candidate.extracted_skills || [])
    .map((skill) => (typeof skill === "string" ? skill : skill.name))
    .filter(Boolean)
    .map((skill) => skill.toLowerCase());
  const requiredSkills = [
    ...(jobDescription.must_have_skills || []),
    ...(jobDescription.nice_to_have_skills || [])
  ];
  const matched = requiredSkills.filter((skill) =>
    candidateSkillNames.some((candidateSkill) => candidateSkill.includes(skill.toLowerCase()))
  );
  const score = requiredSkills.length
    ? Math.round((matched.length / requiredSkills.length) * 70 + 10)
    : 45;

  return normalizeJobMatch({
    score: Math.min(82, score),
    rationale: "Mock match estimated from overlapping candidate skills and job requirements.",
    matched_requirements: matched,
    missing_requirements: requiredSkills.filter((skill) => !matched.includes(skill)).slice(0, 6),
    concerns: ["Mock mode cannot evaluate deeper evidence or seniority fit."],
    interview_focus: ["Validate recent hands-on experience with the matched requirements."]
  });
};

const analyzeJsonWithProvider = async ({ provider, prompt, schema, schemaName }) => {
  if (provider === "openai") {
    return requestOpenAIJson({ prompt, schema, schemaName });
  }

  if (provider === "gemini") {
    return requestGeminiJson(prompt);
  }

  throw new Error(`Unsupported LLM_PROVIDER "${provider}". Use "openai", "gemini", or "mock".`);
};

const withQuotaFallback = async ({ mockValue, request }) => {
  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  const fallbackProvider = (process.env.LLM_FALLBACK_PROVIDER || "").toLowerCase();

  if (provider === "mock") {
    return mockValue();
  }

  try {
    return await request(provider);
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new Error("AI provider timed out. Please retry with a smaller PDF.");
    }

    if (fallbackProvider === "mock" && fallbackProvider !== provider && isQuotaError(error)) {
      return mockValue();
    }

    throw error;
  }
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

export const analyzeJobDescriptionText = async (jobText) => {
  if (!jobText || jobText.trim().length < 20) {
    throw new Error("Job description text is too short to analyze.");
  }

  return withQuotaFallback({
    mockValue: () => buildMockJobDescription(jobText),
    request: async (provider) =>
      normalizeJobDescription(
        await analyzeJsonWithProvider({
          provider,
          prompt: buildJobDescriptionPrompt(jobText),
          schema: jobDescriptionSchema,
          schemaName: "job_description_analysis"
        })
      )
  });
};

export const analyzeCandidateJobMatch = async ({ candidate, jobDescription }) =>
  withQuotaFallback({
    mockValue: () => buildMockJobMatch({ candidate, jobDescription }),
    request: async (provider) =>
      normalizeJobMatch(
        await analyzeJsonWithProvider({
          provider,
          prompt: buildJobMatchPrompt({ candidate, jobDescription }),
          schema: jobMatchSchema,
          schemaName: "candidate_job_match"
        })
      )
  });
