import { LockKeyhole, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

const LoginPage = ({ onLogin }) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const isAuthenticated = onLogin({
      password,
      userId: userId.trim()
    });

    if (!isAuthenticated) {
      setError("Invalid login ID or password.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="relative hidden overflow-hidden bg-[#1a365d] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,#ffffff_0,transparent_26%),radial-gradient(circle_at_78%_18%,#7dd3fc_0,transparent_22%),radial-gradient(circle_at_60%_78%,#f8fafc_0,transparent_24%)]" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              IntelliHire Access
            </div>
            <h1 className="mt-8 max-w-2xl text-5xl font-bold leading-tight tracking-normal">
              Recruiter workspace for CV intelligence
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
              Review parsed candidates, skill evidence, profile scores, and saved CV insights from one focused dashboard.
            </p>
          </div>
          <div className="relative z-10 grid max-w-2xl grid-cols-3 gap-3">
            {["CV Parsing", "Profile Score", "Candidate Library"].map((item) => (
              <div className="rounded-md border border-white/15 bg-white/10 p-4" key={item}>
                <p className="text-sm font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#1a365d] text-white">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
                  IntelliHire
                </p>
                <h2 className="text-2xl font-bold tracking-normal text-slate-950">
                  Sign in
                </h2>
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Login ID</span>
                <span className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-3 focus-within:border-[#1a365d] focus-within:ring-2 focus-within:ring-slate-200">
                  <UserRound className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <input
                    autoComplete="username"
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                    onChange={(event) => setUserId(event.target.value)}
                    placeholder="Enter login ID"
                    type="text"
                    value={userId}
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <span className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-3 focus-within:border-[#1a365d] focus-within:ring-2 focus-within:ring-slate-200">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <input
                    autoComplete="current-password"
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    type="password"
                    value={password}
                  />
                </span>
              </label>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1a365d] px-4 py-3 text-sm font-bold text-white transition duration-200 hover:bg-[#25476f] disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!userId.trim() || !password}
                type="submit"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
