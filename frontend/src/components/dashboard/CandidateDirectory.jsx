import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  X,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SkillScoreGuide from "./SkillScoreGuide.jsx";
import SkillScoreList from "./SkillScoreList.jsx";

const formatTimestamp = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

const profileFactorLabels = {
  professional_impact: "Impact",
  role_complexity: "Complexity",
  ownership: "Ownership",
  technical_depth: "Depth",
  career_progression: "Progression",
  evidence_specificity: "Evidence",
  recency: "Recency"
};

const getProfileScoreTone = (score) => {
  if (score >= 90) {
    return "text-emerald-700";
  }

  if (score >= 75) {
    return "text-[#1a365d]";
  }

  if (score >= 55) {
    return "text-amber-700";
  }

  return "text-red-700";
};

const CandidateDirectory = ({
  candidates,
  deleteError,
  error,
  isDeleting,
  isLoading,
  onClearDeleteError,
  onDeleteCandidate,
  onRefresh,
  onSelectedCandidateChange
}) => {
  const [candidatePendingDelete, setCandidatePendingDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const searchableText = [
        candidate.name,
        candidate.email,
        candidate.resume_url,
        candidate.summary,
        ...(candidate.skill_scores || []).map((skill) => skill.name),
        ...(candidate.skill_scores || []).map((skill) => skill.level),
        ...(candidate.skill_scores || []).map((skill) => skill.evidence),
        ...(candidate.extracted_skills || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [candidates, searchTerm]);

  useEffect(() => {
    if (!filteredCandidates.length) {
      setSelectedCandidateId("");
      return;
    }

    const hasSelectedCandidate = filteredCandidates.some(
      (candidate) => candidate._id === selectedCandidateId
    );

    if (!hasSelectedCandidate) {
      setSelectedCandidateId(filteredCandidates[0]._id);
    }
  }, [filteredCandidates, selectedCandidateId]);

  const selectedCandidate =
    filteredCandidates.find((candidate) => candidate._id === selectedCandidateId) ||
    filteredCandidates[0];

  useEffect(() => {
    onSelectedCandidateChange?.(selectedCandidate || null);
  }, [onSelectedCandidateChange, selectedCandidate]);

  const openDeleteConfirmation = (candidate) => {
    onClearDeleteError();
    setCandidatePendingDelete(candidate);
  };

  const closeDeleteConfirmation = () => {
    onClearDeleteError();
    setCandidatePendingDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!candidatePendingDelete?._id) {
      return;
    }

    try {
      await onDeleteCandidate(candidatePendingDelete._id);
      closeDeleteConfirmation();
    } catch {
      // The parent owns the displayed error so the modal can stay open for retry.
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
      <section className="grid min-w-0 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
                  Candidates
                </p>
                <h3 className="mt-1 text-lg font-bold tracking-normal text-slate-950">
                  Parsed CVs
                </h3>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition duration-200 hover:border-[#1a365d] hover:text-[#1a365d] disabled:cursor-not-allowed disabled:text-slate-300"
                disabled={isLoading}
                onClick={onRefresh}
                title="Refresh candidates"
                type="button"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
                <span className="sr-only">Refresh candidates</span>
              </button>
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 focus-within:border-[#1a365d] focus-within:ring-2 focus-within:ring-slate-200">
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search candidates"
                type="search"
                value={searchTerm}
              />
            </label>
          </div>

          {error ? (
            <div className="m-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="max-h-[420px] overflow-y-auto p-3 xl:max-h-[680px]">
            {isLoading && !candidates.length ? (
              <div className="space-y-3 p-2">
                {[0, 1, 2].map((item) => (
                  <div className="h-24 animate-pulse rounded-lg bg-slate-100" key={item} />
                ))}
              </div>
            ) : null}

            {!isLoading && !filteredCandidates.length ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <UserRound className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  No parsed candidates found
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Successfully parsed CVs will appear here.
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              {filteredCandidates.map((candidate) => {
                const isSelected = candidate._id === selectedCandidate?._id;

                return (
                  <button
                    className={`w-full min-w-0 rounded-md border px-4 py-3 text-left transition duration-200 ${
                      isSelected
                        ? "border-[#1a365d] bg-slate-50"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                    key={candidate._id}
                    onClick={() => setSelectedCandidateId(candidate._id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {candidate.name || "Not available"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {candidate.email || "Not available"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {(candidate.skill_scores || []).length} skills
                      </span>
                    </div>
                    <p className="mt-3 flex min-w-0 items-center gap-2 text-xs font-medium text-slate-500">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 truncate">{formatTimestamp(candidate.createdAt)}</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {selectedCandidate ? (
            <div className="min-w-0">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
                    Candidate Details
                  </p>
                  <h3 className="mt-1 truncate text-2xl font-bold tracking-normal text-slate-950">
                    {selectedCandidate.name || "Not available"}
                  </h3>
                  <div className="mt-3 flex min-w-0 flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0 text-[#1a365d]" aria-hidden="true" />
                      <span className="min-w-0 truncate">
                        {selectedCandidate.email || "Not available"}
                      </span>
                    </span>
                    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
                      <CalendarClock className="h-4 w-4 shrink-0 text-[#1a365d]" aria-hidden="true" />
                      <span className="min-w-0 truncate">
                        Uploaded {formatTimestamp(selectedCandidate.createdAt)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
                  <div className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 max-w-full truncate sm:max-w-48">
                      {selectedCandidate.resume_url || "Resume file"}
                    </span>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition duration-200 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isDeleting}
                    onClick={() => openDeleteConfirmation(selectedCandidate)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-6 py-6">
                <section className="max-w-4xl min-w-0">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Summary
                  </h4>
                  <p className="mt-3 break-words text-sm leading-6 text-slate-700">
                    {selectedCandidate.summary || "No summary was extracted for this candidate."}
                  </p>
                </section>

                {selectedCandidate.profile_score ? (
                  <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-[#1a365d]" aria-hidden="true" />
                          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                            Profile Score
                          </h4>
                        </div>
                        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                          {selectedCandidate.profile_score.rationale ||
                            "Candidate strength estimated from CV evidence. This is not a job-description match score."}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className={`text-2xl font-bold ${getProfileScoreTone(selectedCandidate.profile_score.score)}`}>
                          {selectedCandidate.profile_score.score}%
                        </p>
                        <p className="text-sm font-semibold text-slate-600">
                          {selectedCandidate.profile_score.label}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
                      {(selectedCandidate.profile_score.strengths || []).length ? (
                        <div className="min-w-0 rounded-md bg-slate-50 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Strengths
                          </p>
                          <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-700">
                            {selectedCandidate.profile_score.strengths.map((strength, index) => (
                              <li className="break-words" key={`${strength}-${index}`}>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {(selectedCandidate.profile_score.caveats || []).length ? (
                        <div className="min-w-0 rounded-md bg-slate-50 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Caveats
                          </p>
                          <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-700">
                            {selectedCandidate.profile_score.caveats.map((caveat, index) => (
                              <li className="break-words" key={`${caveat}-${index}`}>
                                {caveat}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {Object.entries(selectedCandidate.profile_score.score_factors || {}).map(
                        ([factor, value]) => (
                          <div className="min-w-0 rounded-md border border-slate-200 px-3 py-2" key={factor}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-slate-500">
                                {profileFactorLabels[factor] || factor}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {value}%
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-[#1a365d]"
                                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                ) : null}

                <section className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Skills
                      </h4>
                      <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                        AI-scored strengths and low-evidence mentions from the CV.
                      </p>
                    </div>
                    <div className="min-w-0 lg:w-80">
                      <SkillScoreGuide compact />
                    </div>
                  </div>

                  <div className="mt-4">
                    <SkillScoreList columns skillScores={selectedCandidate.skill_scores || []} />
                  </div>
                </section>
              </div>

              <section className="border-t border-slate-200 pt-6">
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Experience Details
                </h4>
                {(selectedCandidate.experience_timeline || []).length ? (
                  <div className="mt-4 space-y-4">
                    {selectedCandidate.experience_timeline.map((item, index) => (
                      <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4" key={`${item.title}-${index}`}>
                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h5 className="break-words text-sm font-bold text-slate-950">{item.title}</h5>
                            <p className="mt-1 break-words text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {item.company}
                            </p>
                          </div>
                          <span className="w-fit max-w-full break-words rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                            {item.period}
                          </span>
                        </div>
                        <p className="mt-3 break-words text-sm leading-6 text-slate-600">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                    No experience details were extracted from this CV.
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
              <div>
                <UserRound className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Select a candidate
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {candidatePendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-950/10">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    Delete parsed candidate?
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    This removes the saved CV analysis from the candidate library.
                  </p>
                </div>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeleting}
                onClick={closeDeleteConfirmation}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close confirmation</span>
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="truncate text-sm font-bold text-slate-950">
                  {candidatePendingDelete.name || "Not available"}
                </p>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {candidatePendingDelete.email || "Not available"}
                </p>
                <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="truncate">
                    {candidatePendingDelete.resume_url || "Resume file"}
                  </span>
                </p>
              </div>

              {deleteError ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {deleteError}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeleting}
                onClick={closeDeleteConfirmation}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                type="button"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
                {isDeleting ? "Deleting" : "Delete candidate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default CandidateDirectory;
