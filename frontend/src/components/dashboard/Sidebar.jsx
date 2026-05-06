import { BriefcaseBusiness, LayoutDashboard, Settings, UsersRound } from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness, isDisabled: true },
  { id: "candidates", label: "Candidates", icon: UsersRound },
  { id: "settings", label: "Settings", icon: Settings, isDisabled: true }
];

const Sidebar = ({ activeView, candidateCount, onViewChange }) => {
  const renderNavItem = (item, variant = "desktop") => {
    const Icon = item.icon;
    const isActive = activeView === item.id;
    const isMobile = variant === "mobile";

    return (
      <button
        aria-current={isActive ? "page" : undefined}
        className={
          isMobile
            ? `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-semibold transition duration-200 ${
                isActive
                  ? "bg-[#1a365d] text-white shadow-sm"
                  : item.isDisabled
                    ? "cursor-not-allowed text-slate-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#1a365d]"
              }`
            : `flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition duration-200 ${
                isActive
                  ? "bg-white text-[#1a365d] shadow-sm"
                  : item.isDisabled
                    ? "cursor-not-allowed text-slate-400"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`
        }
        disabled={item.isDisabled}
        key={item.label}
        onClick={() => onViewChange(item.id)}
        type="button"
      >
        <Icon className={isMobile ? "h-5 w-5" : "h-5 w-5"} aria-hidden="true" />
        <span className={isMobile ? "max-w-full truncate" : ""}>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-800 bg-[#1a365d] lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-200">
              IntelliHire
            </p>
            <h1 className="mt-2 text-xl font-bold tracking-normal text-white">
              Talent Console
            </h1>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {navItems.map((item) => renderNavItem(item))}
          </nav>

          <div className="border-t border-white/10 px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-300">
              Hiring Pipeline
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-100">
              {candidateCount} parsed candidates
            </p>
            <p className="mt-4 text-xs leading-5 text-slate-300">
              © Subhasis Pradhan
            </p>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur lg:hidden">
        <p className="mb-1 text-center text-[11px] font-medium text-slate-400">
          © Subhasis Pradhan
        </p>
        <div className="mx-auto flex max-w-md items-center gap-1">
          {navItems.map((item) => renderNavItem(item, "mobile"))}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
