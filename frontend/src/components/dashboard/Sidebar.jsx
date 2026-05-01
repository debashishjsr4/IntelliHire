import { BriefcaseBusiness, LayoutDashboard, Settings, UsersRound } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, isActive: true },
  { label: "Jobs", icon: BriefcaseBusiness },
  { label: "Candidates", icon: UsersRound },
  { label: "Settings", icon: Settings }
];

const Sidebar = () => {
  return (
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
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition duration-200 ${
                  item.isActive
                    ? "bg-white text-[#1a365d] shadow-sm"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
                href="#"
                key={item.label}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-300">
            Hiring Pipeline
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-100">
            24 active candidates
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

