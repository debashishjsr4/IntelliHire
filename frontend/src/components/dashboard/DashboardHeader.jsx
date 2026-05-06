import { Bell, ChevronDown, UserRound } from "lucide-react";
import { useState } from "react";
import MatchScore from "./MatchScore.jsx";

const DashboardHeader = ({
  candidateName,
  profileScore,
  subtitle = "Candidate Insight Dashboard",
  title
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
            {subtitle}
          </p>
          <h2 className="mt-1 truncate text-xl font-bold tracking-normal text-slate-950 sm:text-2xl">
            {title || candidateName || "Resume Intelligence"}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <MatchScore profileScore={profileScore} />
          </div>

          <button
            className="hidden h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition duration-200 hover:border-[#1a365d] hover:text-[#1a365d] sm:inline-flex"
            type="button"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Notifications</span>
          </button>

          <div className="relative">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:border-[#1a365d] hover:text-[#1a365d] sm:px-3"
              onClick={() => setIsProfileOpen((current) => !current)}
              type="button"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a365d] text-white">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden sm:inline">User Profile</span>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white py-2 shadow-lg">
                <button className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#1a365d]">
                  Account
                </button>
                <button className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#1a365d]">
                  Team Settings
                </button>
                <button className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#1a365d]">
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
