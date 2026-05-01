import { useState } from "react";
import { parseResume } from "../lib/api.js";
import DashboardHeader from "./dashboard/DashboardHeader.jsx";
import InsightsGrid from "./dashboard/InsightsGrid.jsx";
import Sidebar from "./dashboard/Sidebar.jsx";
import UploadPanel from "./dashboard/UploadPanel.jsx";

const CandidateInsightDashboard = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      const data = await parseResume({ file, name, email });
      setResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <Sidebar />

      <div className="lg:pl-72">
        <DashboardHeader candidateName={name || result?.candidate?.name} matchScore={85} />

        <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
          <UploadPanel
            email={email}
            error={error}
            file={file}
            isLoading={isLoading}
            name={name}
            onEmailChange={setEmail}
            onFileChange={setFile}
            onNameChange={setName}
            onSubmit={handleSubmit}
          />

          <InsightsGrid isLoading={isLoading} result={result} />
        </main>
      </div>
    </div>
  );
};

export default CandidateInsightDashboard;
