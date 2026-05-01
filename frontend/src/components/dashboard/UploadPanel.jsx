import { FileText, Loader2, UploadCloud } from "lucide-react";

const UploadPanel = ({
  email,
  error,
  file,
  isLoading,
  name,
  onEmailChange,
  onFileChange,
  onNameChange,
  onSubmit
}) => {
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
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Candidate name</span>
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition duration-200 focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Ada Lovelace"
            type="text"
            value={name}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Candidate email</span>
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition duration-200 focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="ada@example.com"
            type="email"
            value={email}
          />
        </label>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition duration-200 hover:border-[#1a365d] hover:bg-slate-100">
          <UploadCloud className="h-9 w-9 text-[#1a365d]" aria-hidden="true" />
          <span className="mt-3 text-sm font-semibold text-slate-800">
            {file ? file.name : "Upload PDF resume"}
          </span>
          <span className="mt-1 text-xs text-slate-500">PDF only, up to 4 MB</span>
          <input
            accept="application/pdf"
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
          {isLoading ? "Analyzing Resume" : "Generate Insights"}
        </button>
      </form>
    </section>
  );
};

export default UploadPanel;
