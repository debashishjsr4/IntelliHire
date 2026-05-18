import { useEffect, useState } from "react";
import CandidateInsightDashboard from "./components/CandidateInsightDashboard.jsx";
import LoginPage from "./components/LoginPage.jsx";
import { fetchCurrentUser, loginUser } from "./lib/api.js";

const AUTH_STORAGE_KEY = "intellihire-auth-user";
const AUTH_LAST_ACTIVITY_KEY = "intellihire-auth-last-activity";
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 60 * 1000;

const getLastActivity = () => {
  const value = Number.parseInt(window.localStorage.getItem(AUTH_LAST_ACTIVITY_KEY) || "", 10);

  return Number.isFinite(value) ? value : 0;
};

const setLastActivity = (timestamp = Date.now()) => {
  window.localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(timestamp));
};

const clearStoredSession = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
};

const isSessionExpired = () => {
  const lastActivity = getLastActivity();

  return Boolean(lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT_MS);
};

const App = () => {
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [sessionNotice, setSessionNotice] = useState("");

  useEffect(() => {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedUser) {
      setIsRestoringSession(false);
      return;
    }

    const restoreSession = async () => {
      try {
        if (isSessionExpired()) {
          clearStoredSession();
          setSessionNotice("Your session expired after 8 hours of inactivity. Please sign in again.");
          setAuthenticatedUser(null);
          return;
        }

        if (!getLastActivity()) {
          setLastActivity();
        }

        const parsedUser = JSON.parse(storedUser);
        const data = await fetchCurrentUser({ userId: parsedUser.userId });
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        setAuthenticatedUser(data.user);
      } catch {
        clearStoredSession();
        setAuthenticatedUser(null);
      } finally {
        setIsRestoringSession(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = async ({ password, userId }) => {
    const data = await loginUser({ password, userId });
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
    setLastActivity();
    setSessionNotice("");
    setAuthenticatedUser(data.user);
  };

  const handleLogout = () => {
    clearStoredSession();
    setSessionNotice("");
    setAuthenticatedUser(null);
  };

  const handleAuthenticatedUserChange = (user) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setLastActivity();
    setAuthenticatedUser(user);
  };

  useEffect(() => {
    if (!authenticatedUser) {
      return undefined;
    }

    let lastWrite = getLastActivity() || Date.now();
    setLastActivity(lastWrite);

    const expireSession = () => {
      clearStoredSession();
      setAuthenticatedUser(null);
      setSessionNotice("Your session expired after 8 hours of inactivity. Please sign in again.");
    };

    const checkSession = () => {
      if (isSessionExpired()) {
        expireSession();
      }
    };

    const recordActivity = () => {
      const now = Date.now();

      if (now - lastWrite >= ACTIVITY_WRITE_THROTTLE_MS) {
        lastWrite = now;
        setLastActivity(now);
      }
    };

    const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity, { passive: true })
    );
    window.addEventListener("focus", checkSession);
    document.addEventListener("visibilitychange", checkSession);

    const intervalId = window.setInterval(checkSession, 60 * 1000);

    return () => {
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, recordActivity)
      );
      window.removeEventListener("focus", checkSession);
      document.removeEventListener("visibilitychange", checkSession);
      window.clearInterval(intervalId);
    };
  }, [authenticatedUser]);

  if (isRestoringSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-sm">
          Loading IntelliHire
        </div>
      </main>
    );
  }

  if (!authenticatedUser) {
    return <LoginPage notice={sessionNotice} onLogin={handleLogin} />;
  }

  return (
    <CandidateInsightDashboard
      authenticatedUser={authenticatedUser}
      onAuthenticatedUserChange={handleAuthenticatedUserChange}
      onLogout={handleLogout}
    />
  );
};

export default App;
