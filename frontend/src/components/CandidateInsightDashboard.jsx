import { useCallback, useEffect, useState } from "react";
import {
  deleteParsedCandidate,
  fetchParsedCandidates,
  parseResume
} from "../lib/api.js";
import CandidateDirectory from "./dashboard/CandidateDirectory.jsx";
import DashboardHeader from "./dashboard/DashboardHeader.jsx";
import InsightsGrid from "./dashboard/InsightsGrid.jsx";
import Sidebar from "./dashboard/Sidebar.jsx";
import UploadPanel from "./dashboard/UploadPanel.jsx";

const CandidateInsightDashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [candidates, setCandidates] = useState([]);
  const [candidatesError, setCandidatesError] = useState("");
  const [deleteCandidateError, setDeleteCandidateError] = useState("");
  const [deletingCandidateId, setDeletingCandidateId] = useState("");
  const [isCandidatesLoading, setIsCandidatesLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadCandidates = useCallback(async () => {
    setCandidatesError("");
    setIsCandidatesLoading(true);

    try {
      const parsedCandidates = await fetchParsedCandidates();
      setCandidates(parsedCandidates);
    } catch (requestError) {
      setCandidatesError(requestError.message);
    } finally {
      setIsCandidatesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleDeleteCandidate = async (candidateId) => {
    setDeleteCandidateError("");
    setDeletingCandidateId(candidateId);

    try {
      await deleteParsedCandidate(candidateId);
      setCandidates((currentCandidates) =>
        currentCandidates.filter((candidate) => candidate._id !== candidateId)
      );
    } catch (requestError) {
      setDeleteCandidateError(requestError.message);
      throw requestError;
    } finally {
      setDeletingCandidateId("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please choose a PDF resume before submitting.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Please upload a PDF smaller than 4 MB for Vercel deployment.");
      return;
    }

    try {
      setIsLoading(true);

      // The API handles PDF extraction, LLM analysis, and MongoDB persistence.
      const data = await parseResume({ file });
      setResult(data);

      if (data.candidate?._id) {
        setCandidates((currentCandidates) => [
          data.candidate,
          ...currentCandidates.filter((candidate) => candidate._id !== data.candidate._id)
        ]);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-950 lg:pb-0">
      <Sidebar
        activeView={activeView}
        candidateCount={candidates.length}
        onViewChange={setActiveView}
      />

      <div className="lg:pl-72">
        <DashboardHeader
          candidateName={result?.candidate?.name}
          matchScore={85}
          subtitle={activeView === "candidates" ? "Candidate Database" : "Candidate Insight Dashboard"}
          title={activeView === "candidates" ? "Parsed CV Library" : undefined}
        />

        {activeView === "candidates" ? (
          <CandidateDirectory
            candidates={candidates}
            deleteError={deleteCandidateError}
            error={candidatesError}
            isDeleting={Boolean(deletingCandidateId)}
            isLoading={isCandidatesLoading}
            onClearDeleteError={() => setDeleteCandidateError("")}
            onDeleteCandidate={handleDeleteCandidate}
            onRefresh={loadCandidates}
          />
        ) : (
          <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
            <UploadPanel
              error={error}
              file={file}
              isLoading={isLoading}
              onFileChange={setFile}
              onSubmit={handleSubmit}
            />

            <InsightsGrid isLoading={isLoading} result={result} />
          </main>
        )}
      </div>
    </div>
  );
};

export default CandidateInsightDashboard;
