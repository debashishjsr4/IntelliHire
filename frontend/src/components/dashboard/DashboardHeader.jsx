import {
  Bell,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  UserRound,
  X
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import MatchScore from "./MatchScore.jsx";

const PasswordInput = ({
  autoComplete,
  disabled,
  isVisible,
  label,
  onChange,
  onToggleVisibility,
  value
}) => (
  <label className="block">
    <span className="text-sm font-semibold text-slate-700">{label}</span>
    <span className={`mt-2 flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2.5 focus-within:border-[#1a365d] focus-within:ring-2 focus-within:ring-slate-200 ${disabled ? "bg-slate-100" : "bg-white"}`}>
      <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      <input
        autoComplete={autoComplete}
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        type={isVisible ? "text" : "password"}
        value={value}
      />
      <button
        className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#1a365d] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
        disabled={disabled}
        onClick={onToggleVisibility}
        type="button"
      >
        {isVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        <span className="sr-only">{isVisible ? "Hide password" : "Show password"}</span>
      </button>
    </span>
  </label>
);

const DashboardHeader = ({
  authenticatedUser,
  candidateName,
  onChangePassword,
  onLogout,
  profileScore,
  subtitle = "Candidate Insight Dashboard",
  title
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    confirm: false,
    current: false,
    next: false
  });
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: "",
    currentPassword: "",
    newPassword: ""
  });
  const displayName = authenticatedUser?.userId || "User Profile";
  const canChangePassword = authenticatedUser?.userId !== "SmartAdmin";
  const isPasswordChangeComplete = Boolean(passwordSuccess);

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordError("");
    setPasswordSuccess("");
    setPasswordForm({
      confirmPassword: "",
      currentPassword: "",
      newPassword: ""
    });
    setPasswordVisibility({
      confirm: false,
      current: false,
      next: false
    });
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (
      !passwordForm.currentPassword.trim() ||
      !passwordForm.newPassword.trim() ||
      !passwordForm.confirmPassword.trim()
    ) {
      setPasswordError("Please complete all password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await onChangePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess("Password updated successfully.");
      setPasswordForm({
        confirmPassword: "",
        currentPassword: "",
        newPassword: ""
      });
    } catch (requestError) {
      setPasswordError(requestError.message || "Unable to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

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
              <span className="hidden max-w-32 truncate sm:inline">
                {displayName}
              </span>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white py-2 shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Signed in as
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {displayName}
                  </p>
                  <p className="mt-1 text-xs font-medium capitalize text-slate-500">
                    {authenticatedUser?.role || "recruiter"}
                  </p>
                </div>
                {canChangePassword ? (
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#1a365d]"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    type="button"
                  >
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    Change password
                  </button>
                ) : null}
                <button
                  className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#1a365d]"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsSignOutConfirmOpen(true);
                  }}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isPasswordModalOpen
        ? createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-24 backdrop-blur-sm sm:py-28">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#1a365d] text-white">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-950">
                  Change password
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Update the password for {displayName}.
                </p>
              </div>
              <button
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={closePasswordModal}
                type="button"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
              <PasswordInput
                autoComplete="current-password"
                disabled={isChangingPassword || isPasswordChangeComplete}
                isVisible={passwordVisibility.current}
                label="Current Password"
                onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
                onToggleVisibility={() => setPasswordVisibility((current) => ({ ...current, current: !current.current }))}
                value={passwordForm.currentPassword}
              />
              <PasswordInput
                autoComplete="new-password"
                disabled={isChangingPassword || isPasswordChangeComplete}
                isVisible={passwordVisibility.next}
                label="New Password"
                onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
                onToggleVisibility={() => setPasswordVisibility((current) => ({ ...current, next: !current.next }))}
                value={passwordForm.newPassword}
              />
              <PasswordInput
                autoComplete="new-password"
                disabled={isChangingPassword || isPasswordChangeComplete}
                isVisible={passwordVisibility.confirm}
                label="Confirm New Password"
                onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
                onToggleVisibility={() => setPasswordVisibility((current) => ({ ...current, confirm: !current.confirm }))}
                value={passwordForm.confirmPassword}
              />

              {passwordError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {passwordError}
                </div>
              ) : null}

              {passwordSuccess ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {passwordSuccess}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={closePasswordModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1a365d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={isChangingPassword || isPasswordChangeComplete}
                  type="submit"
                >
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
          document.body
        )
        : null}

      {isSignOutConfirmOpen
        ? createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#1a365d] text-white">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-950">
                    Sign out?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You will return to the IntelliHire login screen.
                  </p>
                </div>
                <button
                  className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => setIsSignOutConfirmOpen(false)}
                  type="button"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setIsSignOutConfirmOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-md bg-[#1a365d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244a7a]"
                  onClick={onLogout}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}
    </header>
  );
};

export default DashboardHeader;
