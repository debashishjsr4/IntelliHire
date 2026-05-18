import { FileText, Loader2, UploadCloud } from "lucide-react";

const UploadPanel = ({
  error,
  file,
  isLoading,
  jobDescriptions = [],
  onFileChange,
  onJobDescriptionChange,
  onSubmit,
  selectedJobDescriptionId = ""
}) => {
  const selectedJobDescription = jobDescriptions.find(
    (jobDescription) => jobDescription._id === selectedJobDescriptionId
  );

  return (
    <section className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-bold tracking-normal text-slate-950">
          Parse Candidate Resume
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Upload a resume to generate recruiter-ready candidate insights.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {jobDescriptions.length ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Match against job description
            </span>
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
              onChange={(event) => onJobDescriptionChange(event.target.value)}
              value={selectedJobDescriptionId}
            >
              <option value="">No job match</option>
              {jobDescriptions.map((jobDescription) => (
                <option key={jobDescription._id} value={jobDescription._id}>
                  {jobDescription.title}
                </option>
              ))}
            </select>
            {selectedJobDescription ? (
              <span className="mt-2 block rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                This upload will generate candidate insights and a Job Match Score for {selectedJobDescription.title}.
              </span>
            ) : null}
          </label>
        ) : null}

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition duration-200 hover:border-[#1a365d] hover:bg-slate-100">
          <UploadCloud className="h-9 w-9 text-[#1a365d]" aria-hidden="true" />
          <span className="mt-3 text-sm font-semibold text-slate-800">
            {file ? file.name : "Upload resume file"}
          </span>
          <span className="mt-1 text-xs text-slate-500">PDF or DOCX, up to 4 MB</span>
          <input
            accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
            className="sr-only"
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            type="file"
          />
        </label>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1a365d] px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileText className="h-4 w-4" aria-hidden="true" />
          )}
          {isLoading
            ? selectedJobDescriptionId
              ? "Analyzing and Matching"
              : "Analyzing Resume"
            : selectedJobDescriptionId
              ? "Generate Insights and Match"
              : "Generate Insights"}
        </button>
      </form>
    </section>
  );
};

export default UploadPanel;
