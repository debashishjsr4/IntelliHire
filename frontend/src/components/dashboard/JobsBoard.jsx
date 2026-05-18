import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardPaste,
  FileText,
  Loader2,
  Pencil,
  Search,
  RefreshCw,
  Save,
  Trash2,
  X,
  UploadCloud
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

const getMatchTone = (score) => {
  if (score >= 85) {
    return "text-emerald-700";
  }

  if (score >= 70) {
    return "text-[#1a365d]";
  }

  if (score >= 55) {
    return "text-amber-700";
  }

  return "text-red-700";
};

const JobsBoard = ({
  candidates,
  deletingJobDescriptionId,
  error,
  isLoading,
  isMatching,
  isShortlisting,
  isUploading,
  jobDescriptions,
  onDeleteJobDescription,
  onCreateJobDescriptionFromText,
  onFindCandidates,
  onMatchSelectedCandidates,
  onRefresh,
  onUpdateJobDescriptionTitle,
  onUploadJobDescription,
  shortlistsByJobId = {}
}) => {
  const [creationMode, setCreationMode] = useState("file");
  const [deletePendingJob, setDeletePendingJob] = useState(null);
  const [editingJobId, setEditingJobId] = useState("");
  const [file, setFile] = useState(null);
  const [pastedJobText, setPastedJobText] = useState("");
  const [pasteSourceName, setPasteSourceName] = useState("");
  const [isRenamingJob, setIsRenamingJob] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState("");
  const [requirementsTab, setRequirementsTab] = useState("must");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [shortlistLimit, setShortlistLimit] = useState(10);
  const pasteEditorRef = useRef(null);
  const shortlistPanelRef = useRef(null);

  const selectedJob =
    jobDescriptions.find((jobDescription) => jobDescription._id === selectedJobId) ||
    jobDescriptions[0];

  const shortlist = selectedJob?._id ? shortlistsByJobId[selectedJob._id] || [] : [];
  const hasSpecifiedValue = (value) =>
    typeof value === "string" && value.trim() && value.trim().toLowerCase() !== "not specified";
  const roleInfoItems = [
    ...(hasSpecifiedValue(selectedJob?.seniority_level)
      ? [`Seniority: ${selectedJob.seniority_level}`]
      : []),
    ...(hasSpecifiedValue(selectedJob?.domain_context)
      ? [`Domain context: ${selectedJob.domain_context}`]
      : []),
    ...(hasSpecifiedValue(selectedJob?.required_experience)
      ? [`Experience: ${selectedJob.required_experience}`]
      : []),
    ...((selectedJob?.role_metadata || []).map((item) => `${item.label}: ${item.value}`))
  ];
  const requirementGroups = [
    { id: "must", label: "Must-have", items: selectedJob?.must_have_skills || [] },
    { id: "nice", label: "Nice-to-have", items: selectedJob?.nice_to_have_skills || [] },
    {
      id: "experience",
      label: "Experience",
      items: (selectedJob?.experience_requirements || []).length
        ? selectedJob.experience_requirements
        : hasSpecifiedValue(selectedJob?.required_experience)
          ? [selectedJob.required_experience]
          : []
    },
    { id: "education", label: "Education", items: selectedJob?.education_requirements || [] },
    { id: "responsibilities", label: "Responsibilities", items: selectedJob?.responsibilities || [] },
    { id: "criteria", label: "Criteria", items: selectedJob?.evaluation_criteria || [] },
    { id: "role-info", label: "Role Info", items: roleInfoItems },
    ...(selectedJob?.additional_sections || []).map((section, index) => ({
      id: `additional-${index}`,
      label: section.title,
      items: section.items
    })),
    { id: "source-notes", label: "Source Notes", items: selectedJob?.source_notes || [] }
  ].filter((group) => group.items.length);
  const activeRequirementGroup =
    requirementGroups.find((group) => group.id === requirementsTab) || requirementGroups[0];

  useEffect(() => {
    setSelectedCandidateIds([]);
  }, [selectedJob?._id]);

  useEffect(() => {
    setRenameError("");
    setEditingJobId("");
    setRenameDraft("");
    const nextRequirementGroups = [
      { id: "must", items: selectedJob?.must_have_skills || [] },
      { id: "nice", items: selectedJob?.nice_to_have_skills || [] },
      { id: "experience", items: selectedJob?.experience_requirements || [] },
      { id: "education", items: selectedJob?.education_requirements || [] },
      { id: "responsibilities", items: selectedJob?.responsibilities || [] },
      { id: "criteria", items: selectedJob?.evaluation_criteria || [] }
    ];
    setRequirementsTab(nextRequirementGroups.find((group) => group.items.length)?.id || "must");
  }, [selectedJob?._id]);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    try {
      const uploadedJob = await onUploadJobDescription(file);
      setSelectedJobId(uploadedJob._id);
      setFile(null);
    } catch {
      // The parent owns the displayed upload error.
    }
  };

  const handlePastedJobInput = () => {
    setPastedJobText(pasteEditorRef.current?.innerText || "");
  };

  const handleCreateFromText = async (event) => {
    event.preventDefault();

    if (!pastedJobText.trim()) {
      return;
    }

    try {
      const createdJob = await onCreateJobDescriptionFromText({
        sourceName: pasteSourceName.trim() || "Pasted job description",
        text: pastedJobText.trim()
      });
      setSelectedJobId(createdJob._id);
      setPasteSourceName("");
      setPastedJobText("");

      if (pasteEditorRef.current) {
        pasteEditorRef.current.innerHTML = "";
      }
    } catch {
      // The parent owns the displayed creation error.
    }
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidateIds((currentIds) =>
      currentIds.includes(candidateId)
        ? currentIds.filter((currentId) => currentId !== candidateId)
        : [...currentIds, candidateId]
    );
  };

  const handleMatchCandidate = (candidateId) => {
    if (!selectedJob?._id) {
      return;
    }

    onMatchSelectedCandidates({
      candidateIds: [candidateId],
      jobDescriptionId: selectedJob._id
    });
  };

  const handleMatchSelected = () => {
    if (!selectedJob?._id) {
      return;
    }

    onMatchSelectedCandidates({
      candidateIds: selectedCandidateIds,
      jobDescriptionId: selectedJob._id
    });
  };

  const handleFindCandidates = () => {
    if (!selectedJob?._id) {
      return;
    }

    onFindCandidates({
      jobDescriptionId: selectedJob._id,
      limit: shortlistLimit
    });

    window.setTimeout(() => {
      shortlistPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }, 100);
  };

  const startRename = () => {
    if (!selectedJob?._id) {
      return;
    }

    setRenameError("");
    setEditingJobId(selectedJob._id);
    setRenameDraft(selectedJob.title || "");
  };

  const cancelRename = () => {
    setRenameError("");
    setEditingJobId("");
    setRenameDraft("");
  };

  const handleRename = async () => {
    if (!selectedJob?._id) {
      return;
    }

    const nextTitle = renameDraft.trim();

    if (!nextTitle) {
      setRenameError("Job description name is required.");
      return;
    }

    setRenameError("");
    setIsRenamingJob(true);

    try {
      await onUpdateJobDescriptionTitle({
        jobDescriptionId: selectedJob._id,
        title: nextTitle
      });
      cancelRename();
    } catch (requestError) {
      setRenameError(requestError.message || "Unable to rename job description.");
    } finally {
      setIsRenamingJob(false);
    }
  };

  const handleConfirmDeleteJob = async () => {
    if (!deletePendingJob?._id) {
      return;
    }

    try {
      await onDeleteJobDescription(deletePendingJob._id);
      setDeletePendingJob(null);
      if (selectedJobId === deletePendingJob._id) {
        setSelectedJobId("");
      }
    } catch {
      // The parent owns the displayed API error.
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
      <section className="grid min-w-0 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
                  Job Descriptions
                </p>
                <h3 className="mt-1 text-lg font-bold tracking-normal text-slate-950">
                  Requirement Library
                </h3>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition duration-200 hover:border-[#1a365d] hover:text-[#1a365d] disabled:cursor-not-allowed disabled:text-slate-300"
                disabled={isLoading}
                onClick={onRefresh}
                title="Refresh job descriptions"
                type="button"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
                <span className="sr-only">Refresh job descriptions</span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 rounded-md bg-slate-100 p-1">
              <button
                className={`inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition ${
                  creationMode === "file" ? "bg-white text-[#1a365d] shadow-sm" : "text-slate-600"
                }`}
                onClick={() => setCreationMode("file")}
                type="button"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                File
              </button>
              <button
                className={`inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition ${
                  creationMode === "paste" ? "bg-white text-[#1a365d] shadow-sm" : "text-slate-600"
                }`}
                onClick={() => setCreationMode("paste")}
                type="button"
              >
                <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
                Paste
              </button>
            </div>

            {creationMode === "file" ? (
              <form className="mt-3 space-y-3" onSubmit={handleUpload}>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-[#1a365d] hover:bg-slate-100">
                  <UploadCloud className="h-7 w-7 text-[#1a365d]" aria-hidden="true" />
                  <span className="mt-2 text-sm font-semibold text-slate-800">
                    {file ? file.name : "Upload JD file"}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">PDF or DOCX, up to 4 MB</span>
                  <input
                    accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                    className="sr-only"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    type="file"
                  />
                </label>
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1a365d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={!file || isUploading}
                  type="submit"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
                  {isUploading ? "Analyzing JD" : "Save Job Description"}
                </button>
              </form>
            ) : (
              <form className="mt-3 space-y-3" onSubmit={handleCreateFromText}>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
                  onChange={(event) => setPasteSourceName(event.target.value)}
                  placeholder="Optional source name"
                  value={pasteSourceName}
                />
                <div
                  className="min-h-40 max-h-72 overflow-y-auto rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200 empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
                  contentEditable={!isUploading}
                  data-placeholder="Paste formatted job description text here"
                  onInput={handlePastedJobInput}
                  ref={pasteEditorRef}
                  role="textbox"
                  suppressContentEditableWarning
                />
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1a365d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={pastedJobText.trim().length < 20 || isUploading}
                  type="submit"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ClipboardPaste className="h-4 w-4" aria-hidden="true" />}
                  {isUploading ? "Analyzing JD" : "Create from Text"}
                </button>
              </form>
            )}
          </div>

          {error ? (
            <div className="m-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="max-h-[560px] overflow-y-auto p-3">
            {!jobDescriptions.length && !isLoading ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  No job descriptions yet
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              {jobDescriptions.map((jobDescription) => {
                const isSelected = jobDescription._id === selectedJob?._id;

                return (
                  <button
                    className={`w-full rounded-md border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-[#1a365d] bg-slate-50"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                    key={jobDescription._id}
                    onClick={() => setSelectedJobId(jobDescription._id)}
                    type="button"
                  >
                    <p className="truncate text-sm font-bold text-slate-950">
                      {jobDescription.title}
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <p className="flex min-w-0 items-center gap-2">
                        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 truncate">
                          {jobDescription.source_file || "Source not specified"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {formatTimestamp(jobDescription.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {selectedJob ? (
            <div className="min-w-0">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
                    Job Requirement Profile
                  </p>
                  {editingJobId === selectedJob._id ? (
                    <div className="mt-2 max-w-2xl">
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                        <input
                          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-xl font-bold text-slate-950 outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
                          disabled={isRenamingJob}
                          onChange={(event) => setRenameDraft(event.target.value)}
                          value={renameDraft}
                        />
                        <div className="grid grid-cols-2 gap-2 sm:w-44">
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1a365d] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:bg-slate-400"
                            disabled={isRenamingJob}
                            onClick={handleRename}
                            type="button"
                          >
                            {isRenamingJob ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                            Save
                          </button>
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isRenamingJob}
                            onClick={cancelRename}
                            type="button"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                            Cancel
                          </button>
                        </div>
                      </div>
                      {renameError ? (
                        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {renameError}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-1 flex min-w-0 items-start gap-2">
                      <h3 className="min-w-0 break-words text-2xl font-bold tracking-normal text-slate-950">
                        {selectedJob.title}
                      </h3>
                      <button
                        className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-[#1a365d] hover:text-[#1a365d]"
                        onClick={startRename}
                        title="Rename job description"
                        type="button"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Rename job description</span>
                      </button>
                      <button
                        className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50"
                        disabled={Boolean(deletingJobDescriptionId)}
                        onClick={() => setDeletePendingJob(selectedJob)}
                        title="Delete job description"
                        type="button"
                      >
                        {deletingJobDescriptionId === selectedJob._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span className="sr-only">Delete job description</span>
                      </button>
                    </div>
                  )}
                  <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                    {selectedJob.summary || "No summary extracted."}
                  </p>
                  <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-[#1a365d]" aria-hidden="true" />
                    <span className="shrink-0 text-slate-500">Source</span>
                    <span className="min-w-0 truncate">
                      {selectedJob.source_file || "Source not specified"}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <select
                    className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
                    onChange={(event) => setShortlistLimit(Number(event.target.value))}
                    value={shortlistLimit}
                  >
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                    <option value={50}>Top 50</option>
                  </select>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1a365d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={isShortlisting}
                    onClick={handleFindCandidates}
                    type="button"
                  >
                    {isShortlisting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
                    {isShortlisting ? "Finding Candidates" : "Find Best Candidates"}
                  </button>
                </div>
              </div>

              <div className="grid min-w-0 gap-5 py-5 min-[1800px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <section className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Requirements
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Compact view of the role signals used for matching.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {requirementGroups.map((group) => {
                        const isActive = group.id === activeRequirementGroup.id;

                        return (
                          <button
                            className={`flex min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                              isActive
                                ? "border-[#1a365d] bg-white text-[#1a365d] shadow-sm"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                            key={group.id}
                            onClick={() => setRequirementsTab(group.id)}
                            type="button"
                          >
                            <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wide">
                              {group.label}
                            </span>
                            <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                              {group.items.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
                      {activeRequirementGroup ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h5 className="text-sm font-bold text-slate-950">
                              {activeRequirementGroup.label}
                            </h5>
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                              {activeRequirementGroup.items.length}
                            </span>
                          </div>
                        <ul className="mt-3 grid gap-2 text-sm leading-5 text-slate-700 sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-2">
                          {activeRequirementGroup.items.map((item, index) => (
                            <li
                              className="break-words rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                              key={`${item}-${index}`}
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No structured requirements were extracted from this job description.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section
                  className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm 2xl:sticky 2xl:top-28"
                  ref={shortlistPanelRef}
                >
                  <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          Candidate Shortlist
                        </h4>
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">
                          {shortlist.length ? `${shortlist.length} found` : "Awaiting search"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Results appear here immediately after Find Best Candidates.
                      </p>
                    </div>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1a365d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:border disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      disabled={isMatching || !selectedCandidateIds.length}
                      onClick={handleMatchSelected}
                      type="button"
                    >
                      {isMatching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
                      Run AI Match for Selected
                    </button>
                  </div>

                  <div className="max-h-[640px] space-y-3 overflow-y-auto p-4">
                    {shortlist.length ? (
                      shortlist.map((item) => {
                        const existingMatch = (item.candidate.job_matches || []).find(
                          (jobMatch) => jobMatch.job_description_id === selectedJob._id
                        );

                        return (
                          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={item.candidate._id}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <label className="flex min-w-0 items-start gap-3">
                                <input
                                  checked={selectedCandidateIds.includes(item.candidate._id)}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1a365d]"
                                  onChange={() => toggleCandidateSelection(item.candidate._id)}
                                  type="checkbox"
                                />
                                <span className="min-w-0">
                                  <span className="block break-words text-sm font-bold text-slate-950">
                                    {item.candidate.name}
                                  </span>
                                  <span className="mt-1 block text-xs text-slate-500">
                                    Profile Score: {item.candidate.profile_score?.score ?? 0}% · {item.requirement_signal}
                                  </span>
                                </span>
                              </label>
                              <div className="flex shrink-0 items-center gap-3">
                                <div className="rounded-md bg-slate-50 px-3 py-2 text-right">
                                  <p className="text-lg font-bold text-[#1a365d]">
                                    {item.shortlist_score}%
                                  </p>
                                  <p className="text-xs font-semibold text-slate-600">Shortlist</p>
                                </div>
                                <button
                                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1a365d] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:bg-slate-400"
                                  disabled={isMatching}
                                  onClick={() => handleMatchCandidate(item.candidate._id)}
                                  type="button"
                                >
                                  {existingMatch ? "Refresh AI Match" : "Run AI Match"}
                                </button>
                              </div>
                            </div>
                            {existingMatch ? (
                              <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                                Saved match: <span className={`font-bold ${getMatchTone(existingMatch.score)}`}>{existingMatch.score}% {existingMatch.label}</span>. {existingMatch.rationale}
                              </p>
                            ) : null}
                            {item.matched_requirements.length ? (
                              <p className="mt-3 break-words text-xs leading-5 text-slate-500">
                                Matched signals: {item.matched_requirements.slice(0, 4).join(", ")}
                              </p>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                        <Search className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                        <p className="mt-3 text-sm font-semibold text-slate-800">
                          No shortlist generated yet
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Choose a Top count and click Find Best Candidates.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center">
              <div>
                <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Upload a job description
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {deletePendingJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-950/10">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    Delete job description?
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    This removes the saved job description and all candidate match cards linked to it.
                  </p>
                </div>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={Boolean(deletingJobDescriptionId)}
                onClick={() => setDeletePendingJob(null)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close confirmation</span>
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="break-words text-sm font-bold text-slate-950">
                  {deletePendingJob.title}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatTimestamp(deletePendingJob.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={Boolean(deletingJobDescriptionId)}
                onClick={() => setDeletePendingJob(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                disabled={Boolean(deletingJobDescriptionId)}
                onClick={handleConfirmDeleteJob}
                type="button"
              >
                {deletingJobDescriptionId ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
                {deletingJobDescriptionId ? "Deleting" : "Delete job"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default JobsBoard;
