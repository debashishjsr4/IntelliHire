import { useEffect, useState } from "react";
import CandidateInsightDashboard from "./components/CandidateInsightDashboard.jsx";
import LoginPage from "./components/LoginPage.jsx";

const AUTH_STORAGE_KEY = "intellihire-auth-user";
const STATIC_CREDENTIALS = {
  userId: "SmartAdmin",
  password: "Nlite"
};

const App = () => {
  const [authenticatedUser, setAuthenticatedUser] = useState("");

  useEffect(() => {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (storedUser === STATIC_CREDENTIALS.userId) {
      setAuthenticatedUser(storedUser);
    }
  }, []);

  const handleLogin = ({ password, userId }) => {
    if (userId === STATIC_CREDENTIALS.userId && password === STATIC_CREDENTIALS.password) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, STATIC_CREDENTIALS.userId);
      setAuthenticatedUser(STATIC_CREDENTIALS.userId);
      return true;
    }

    return false;
  };

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthenticatedUser("");
  };

  if (!authenticatedUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <CandidateInsightDashboard
      authenticatedUser={authenticatedUser}
      onLogout={handleLogout}
    />
  );
};

export default App;
