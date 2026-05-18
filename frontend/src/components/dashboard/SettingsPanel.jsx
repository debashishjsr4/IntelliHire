import {
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

const EditableUserRow = ({
  isDeleting,
  isUpdating,
  onDeleteRequest,
  onUpdateUser,
  user
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [draft, setDraft] = useState({
    isLocked: Boolean(user.isLocked),
    password: "",
    role: user.role,
    userId: user.userId
  });

  useEffect(() => {
    setDraft({
      isLocked: Boolean(user.isLocked),
      password: "",
      role: user.role,
      userId: user.userId
    });
  }, [user]);

  const normalizedUserId = draft.userId.trim();
  const isDirty =
    normalizedUserId !== user.userId ||
    draft.role !== user.role ||
    draft.isLocked !== Boolean(user.isLocked) ||
    Boolean(draft.password);

  const handleSave = async () => {
    try {
      await onUpdateUser({
        isLocked: draft.isLocked,
        newUserId: normalizedUserId,
        password: draft.password || undefined,
        role: draft.role,
        userId: user.userId
      });
      setDraft((current) => ({ ...current, password: "" }));
    } catch {
      // The parent owns the displayed API error.
    }
  };

  return (
    <div className={`rounded-lg border p-4 transition ${draft.isLocked ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-white"}`}>
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block min-w-0">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            User ID
          </span>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 focus-within:border-[#1a365d] focus-within:ring-2 focus-within:ring-slate-200">
            {draft.role === "admin" ? (
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#1a365d]" aria-hidden="true" />
            ) : (
              <UserRound className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            )}
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none"
              onChange={(event) => setDraft((current) => ({ ...current, userId: event.target.value }))}
              value={draft.userId}
            />
          </div>
        </label>

        <label className="block min-w-0">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Role
          </span>
          <select
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold capitalize text-slate-700 outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
            value={draft.role}
          >
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label className="block min-w-0">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            New Password
          </span>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 focus-within:border-[#1a365d] focus-within:ring-2 focus-within:ring-slate-200">
            <KeyRound className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
              onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
              placeholder="Leave unchanged"
              type={isPasswordVisible ? "text" : "password"}
              value={draft.password}
            />
            <button
              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#1a365d]"
              onClick={() => setIsPasswordVisible((current) => !current)}
              type="button"
            >
              {isPasswordVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              <span className="sr-only">
                {isPasswordVisible ? "Hide password" : "Show password"}
              </span>
            </button>
          </div>
        </label>

        <button
          className={`inline-flex h-10 items-center justify-center gap-2 self-end rounded-md border px-3 text-sm font-semibold transition ${
            draft.isLocked
              ? "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          onClick={() => setDraft((current) => ({ ...current, isLocked: !current.isLocked }))}
          type="button"
        >
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          {draft.isLocked ? "Locked" : "Unlocked"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          className="inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-md bg-[#1a365d] px-4 text-sm font-semibold text-white transition hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!isDirty || !normalizedUserId || isUpdating || isDeleting}
          onClick={handleSave}
          type="button"
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Save
        </button>
        <button
          className="inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
          disabled={isUpdating || isDeleting}
          onClick={() => onDeleteRequest(user)}
          type="button"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          Delete
        </button>
      </div>
    </div>
  );
};

const SettingsPanel = ({
  authenticatedUser,
  createUserError,
  deletingUserId,
  isCreatingUser,
  isLoadingUsers,
  onCreateUser,
  onDeleteUser,
  onLoadUsers,
  onUpdateUser,
  updatingUserId,
  users
}) => {
  const [form, setForm] = useState({
    userId: "",
    password: "",
    confirmPassword: "",
    role: "recruiter"
  });
  const [confirmUser, setConfirmUser] = useState(null);
  const [localError, setLocalError] = useState("");

  const isAdmin = authenticatedUser?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      onLoadUsers();
    }
  }, [isAdmin, onLoadUsers]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (form.password !== form.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      await onCreateUser({
        password: form.password,
        role: form.role,
        userId: form.userId.trim()
      });

      setForm({
        userId: "",
        password: "",
        confirmPassword: "",
        role: "recruiter"
      });
    } catch {
      // The parent owns the displayed API error.
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmUser) {
      return;
    }

    try {
      await onDeleteUser(confirmUser.userId);
      setConfirmUser(null);
    } catch {
      // The parent owns the displayed API error.
    }
  };

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div>
            <LockKeyhole className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-bold text-slate-950">
              Settings are restricted
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Only admins can create users and manage access.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
      <section className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
            Settings
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-normal text-slate-950">
            Create User
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            SmartAdmin is protected and hidden from this list. Admins can manage every other account.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">User ID</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
              onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
              value={form.userId}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Role</span>
            <select
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              value={form.role}
            >
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              type="password"
              value={form.password}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Confirm Password</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a365d] focus:ring-2 focus:ring-slate-200"
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              type="password"
              value={form.confirmPassword}
            />
          </label>

          {localError || createUserError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {localError || createUserError}
            </div>
          ) : null}

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1a365d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#244a7a] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isCreatingUser || !form.userId.trim() || !form.password || !form.confirmPassword}
            type="submit"
          >
            {isCreatingUser ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {isCreatingUser ? "Creating User" : "Create User"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1a365d]">
              User Management
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-normal text-slate-950">
              Accounts
            </h3>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
            {isLoadingUsers ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            {users.length} managed users
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {users.length ? (
            users.map((user) => (
              <EditableUserRow
                isDeleting={deletingUserId === user.userId}
                isUpdating={updatingUserId === user.userId}
                key={user._id || user.userId}
                onDeleteRequest={setConfirmUser}
                onUpdateUser={onUpdateUser}
                user={user}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
              <UserRound className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No managed users yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Create an admin or recruiter account to see it here.
              </p>
            </div>
          )}
        </div>
      </section>

      {confirmUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-950">
                  Delete user account?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will permanently remove {confirmUser.userId}. The user will no longer be able to sign in.
                </p>
              </div>
              <button
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setConfirmUser(null)}
                type="button"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setConfirmUser(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
                disabled={deletingUserId === confirmUser.userId}
                onClick={handleConfirmDelete}
                type="button"
              >
                {deletingUserId === confirmUser.userId ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default SettingsPanel;
