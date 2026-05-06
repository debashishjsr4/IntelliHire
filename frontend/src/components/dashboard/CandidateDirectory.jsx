import {
  CalendarClock,
  FileText,
  Mail,
  RefreshCw,
  Search,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const CandidateDirectory = ({ candidates, error, isLoading, onRefresh }) => {
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
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

          <div className="max-h-[680px] overflow-y-auto p-3">
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
                    className={`w-full rounded-md border px-4 py-3 text-left transition duration-200 ${
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
                          {candidate.name || "Unknown Candidate"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {candidate.email || "No email captured"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {(candidate.extracted_skills || []).length} skills
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatTimestamp(candidate.createdAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {selectedCandidate ? (
            <div>
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
                    Candidate Details
                  </p>
                  <h3 className="mt-1 truncate text-2xl font-bold tracking-normal text-slate-950">
                    {selectedCandidate.name || "Unknown Candidate"}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#1a365d]" aria-hidden="true" />
                      {selectedCandidate.email || "No email captured"}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-[#1a365d]" aria-hidden="true" />
                      Uploaded {formatTimestamp(selectedCandidate.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  <span className="max-w-48 truncate">
                    {selectedCandidate.resume_url || "Resume file"}
                  </span>
                </div>
              </div>

              <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <section>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Summary
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {selectedCandidate.summary || "No summary was extracted for this candidate."}
                  </p>
                </section>

                <section>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Skills
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedCandidate.extracted_skills || []).length ? (
                      selectedCandidate.extracted_skills.map((skill, index) => (
                        <span
                          className="rounded-md bg-[#1a365d] px-2.5 py-1.5 text-xs font-semibold text-white"
                          key={`${skill}-${index}`}
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No skills extracted.</span>
                    )}
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
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={`${item.title}-${index}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h5 className="text-sm font-bold text-slate-950">{item.title}</h5>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {item.company}
                            </p>
                          </div>
                          <span className="w-fit rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                            {item.period}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
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
    </main>
  );
};

export default CandidateDirectory;
