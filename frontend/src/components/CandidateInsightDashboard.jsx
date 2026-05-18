import { useCallback, useEffect, useState } from "react";
import {
  changeOwnPassword,
  createJobDescriptionFromText,
  createUser,
  deleteJobDescription,
  deleteCandidateJobMatch,
  deleteUser,
  deleteParsedCandidate,
  fetchJobDescriptions,
  fetchJobCandidateShortlist,
  fetchParsedCandidates,
  fetchUsers,
  matchSelectedJobCandidates,
  parseResume,
  updateJobDescriptionTitle,
  updateUser,
  uploadJobDescription
} from "../lib/api.js";
import CandidateDirectory from "./dashboard/CandidateDirectory.jsx";
import DashboardHeader from "./dashboard/DashboardHeader.jsx";
import InsightsGrid from "./dashboard/InsightsGrid.jsx";
import JobsBoard from "./dashboard/JobsBoard.jsx";
import SettingsPanel from "./dashboard/SettingsPanel.jsx";
import Sidebar from "./dashboard/Sidebar.jsx";
import UploadPanel from "./dashboard/UploadPanel.jsx";

const CandidateInsightDashboard = ({ authenticatedUser, onAuthenticatedUserChange, onLogout }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [candidates, setCandidates] = useState([]);
  const [candidatesError, setCandidatesError] = useState("");
  const [deleteCandidateError, setDeleteCandidateError] = useState("");
  const [deleteJobMatchError, setDeleteJobMatchError] = useState("");
  const [deletingCandidateId, setDeletingCandidateId] = useState("");
  const [deletingJobMatchKey, setDeletingJobMatchKey] = useState("");
  const [isCandidatesLoading, setIsCandidatesLoading] = useState(false);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [jobsError, setJobsError] = useState("");
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [isJobUploading, setIsJobUploading] = useState(false);
  const [deletingJobDescriptionId, setDeletingJobDescriptionId] = useState("");
  const [shortlistsByJobId, setShortlistsByJobId] = useState({});
  const [shortlistingJobId, setShortlistingJobId] = useState("");
  const [matchingJobId, setMatchingJobId] = useState("");
  const [selectedJobDescriptionId, setSelectedJobDescriptionId] = useState("");
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [createUserError, setCreateUserError] = useState("");
  const [userActionError, setUserActionError] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [selectedDirectoryCandidate, setSelectedDirectoryCandidate] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadCandidates = useCallback(async () => {
    setCandidatesError("");
    setIsCandidatesLoading(true);

    try {
      const parsedCandidates = await fetchParsedCandidates();
      setCandidates(parsedCandidates);
    } catch (requestError) {
      setCandidatesError(requestError.message);
    } finally {
      setIsCandidatesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const loadJobDescriptions = useCallback(async () => {
    setJobsError("");
    setIsJobsLoading(true);

    try {
      const parsedJobDescriptions = await fetchJobDescriptions();
      setJobDescriptions(parsedJobDescriptions);
    } catch (requestError) {
      setJobsError(requestError.message);
    } finally {
      setIsJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobDescriptions();
  }, [loadJobDescriptions]);

  const loadUsers = useCallback(async () => {
    if (authenticatedUser?.role !== "admin") {
      return;
    }

    setUsersError("");
    setIsUsersLoading(true);

    try {
      const data = await fetchUsers({ userId: authenticatedUser.userId });
      setUsers(data.users || []);
    } catch (requestError) {
      setUsersError(requestError.message);
    } finally {
      setIsUsersLoading(false);
    }
  }, [authenticatedUser]);

  const handleDeleteCandidate = async (candidateId) => {
    setDeleteCandidateError("");
    setDeletingCandidateId(candidateId);

    try {
      await deleteParsedCandidate(candidateId);
      setCandidates((currentCandidates) =>
        currentCandidates.filter((candidate) => candidate._id !== candidateId)
      );
      setSelectedDirectoryCandidate((currentCandidate) =>
        currentCandidate?._id === candidateId ? null : currentCandidate
      );
    } catch (requestError) {
      setDeleteCandidateError(requestError.message);
      throw requestError;
    } finally {
      setDeletingCandidateId("");
    }
  };

  const handleDeleteCandidateJobMatch = async ({ candidateId, jobDescriptionId }) => {
    setDeleteJobMatchError("");
    setDeletingJobMatchKey(`${candidateId}-${jobDescriptionId}`);

    try {
      const data = await deleteCandidateJobMatch({ candidateId, jobDescriptionId });

      if (data.candidate?._id) {
        setCandidates((currentCandidates) =>
          currentCandidates.map((candidate) =>
            candidate._id === data.candidate._id ? data.candidate : candidate
          )
        );
        setSelectedDirectoryCandidate((currentCandidate) =>
          currentCandidate?._id === data.candidate._id ? data.candidate : currentCandidate
        );
      }
    } catch (requestError) {
      setDeleteJobMatchError(requestError.message);
      throw requestError;
    } finally {
      setDeletingJobMatchKey("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please choose a PDF or DOCX resume before submitting.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Please upload a resume file smaller than 4 MB for Vercel deployment.");
      return;
    }

    try {
      setIsLoading(true);

      // The API handles document extraction, LLM analysis, and MongoDB persistence.
      const data = await parseResume({ file, jobDescriptionId: selectedJobDescriptionId });
      setResult(data);

      if (data.candidate?._id) {
        setCandidates((currentCandidates) => [
          data.candidate,
          ...currentCandidates.filter((candidate) => candidate._id !== data.candidate._id)
        ]);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadJobDescription = async (jobDescriptionFile) => {
    setJobsError("");
    setIsJobUploading(true);

    try {
      const jobDescription = await uploadJobDescription({ file: jobDescriptionFile });
      setJobDescriptions((currentJobDescriptions) => [
        jobDescription,
        ...currentJobDescriptions.filter((current) => current._id !== jobDescription._id)
      ]);
      return jobDescription;
    } catch (requestError) {
      setJobsError(requestError.message);
      throw requestError;
    } finally {
      setIsJobUploading(false);
    }
  };

  const handleCreateJobDescriptionFromText = async ({ sourceName, text }) => {
    setJobsError("");
    setIsJobUploading(true);

    try {
      const jobDescription = await createJobDescriptionFromText({ sourceName, text });
      setJobDescriptions((currentJobDescriptions) => [
        jobDescription,
        ...currentJobDescriptions.filter((current) => current._id !== jobDescription._id)
      ]);
      return jobDescription;
    } catch (requestError) {
      setJobsError(requestError.message);
      throw requestError;
    } finally {
      setIsJobUploading(false);
    }
  };

  const handleFindJobCandidates = async ({ jobDescriptionId, limit }) => {
    setJobsError("");
    setShortlistingJobId(jobDescriptionId);

    try {
      const shortlist = await fetchJobCandidateShortlist({ jobDescriptionId, limit });
      setShortlistsByJobId((currentShortlists) => ({
        ...currentShortlists,
        [jobDescriptionId]: shortlist
      }));
    } catch (requestError) {
      setJobsError(requestError.message);
    } finally {
      setShortlistingJobId("");
    }
  };

  const handleUpdateJobDescriptionTitle = async ({ jobDescriptionId, title }) => {
    setJobsError("");

    try {
      const updatedJobDescription = await updateJobDescriptionTitle({ jobDescriptionId, title });
      setJobDescriptions((currentJobDescriptions) =>
        currentJobDescriptions.map((jobDescription) =>
          jobDescription._id === updatedJobDescription._id ? updatedJobDescription : jobDescription
        )
      );
      setCandidates((currentCandidates) =>
        currentCandidates.map((candidate) => ({
          ...candidate,
          job_matches: (candidate.job_matches || []).map((jobMatch) =>
            jobMatch.job_description_id === updatedJobDescription._id
              ? { ...jobMatch, job_title: updatedJobDescription.title }
              : jobMatch
          )
        }))
      );
      setSelectedDirectoryCandidate((currentCandidate) =>
        currentCandidate
          ? {
              ...currentCandidate,
              job_matches: (currentCandidate.job_matches || []).map((jobMatch) =>
                jobMatch.job_description_id === updatedJobDescription._id
                  ? { ...jobMatch, job_title: updatedJobDescription.title }
                  : jobMatch
              )
            }
          : currentCandidate
      );
      return updatedJobDescription;
    } catch (requestError) {
      setJobsError(requestError.message);
      throw requestError;
    }
  };

  const handleDeleteJobDescription = async (jobDescriptionId) => {
    setJobsError("");
    setDeletingJobDescriptionId(jobDescriptionId);

    try {
      await deleteJobDescription(jobDescriptionId);
      setJobDescriptions((currentJobDescriptions) =>
        currentJobDescriptions.filter((jobDescription) => jobDescription._id !== jobDescriptionId)
      );
      setShortlistsByJobId((currentShortlists) => {
        const nextShortlists = { ...currentShortlists };
        delete nextShortlists[jobDescriptionId];
        return nextShortlists;
      });
      setCandidates((currentCandidates) =>
        currentCandidates.map((candidate) => ({
          ...candidate,
          job_matches: (candidate.job_matches || []).filter(
            (jobMatch) => jobMatch.job_description_id !== jobDescriptionId
          )
        }))
      );
      setSelectedDirectoryCandidate((currentCandidate) =>
        currentCandidate
          ? {
              ...currentCandidate,
              job_matches: (currentCandidate.job_matches || []).filter(
                (jobMatch) => jobMatch.job_description_id !== jobDescriptionId
              )
            }
          : currentCandidate
      );
    } catch (requestError) {
      setJobsError(requestError.message);
      throw requestError;
    } finally {
      setDeletingJobDescriptionId("");
    }
  };

  const handleMatchSelectedJobCandidates = async ({ candidateIds, jobDescriptionId }) => {
    if (!candidateIds.length) {
      setJobsError("Select at least one shortlisted candidate to match.");
      return;
    }

    setJobsError("");
    setMatchingJobId(jobDescriptionId);

    try {
      const data = await matchSelectedJobCandidates({ candidateIds, jobDescriptionId });
      setCandidates((currentCandidates) =>
        currentCandidates.map(
          (candidate) =>
            data.candidates.find((updatedCandidate) => updatedCandidate._id === candidate._id) ||
            candidate
        )
      );
      const shortlist = await fetchJobCandidateShortlist({ jobDescriptionId, limit: 20 });
      setShortlistsByJobId((currentShortlists) => ({
        ...currentShortlists,
        [jobDescriptionId]: shortlist
      }));
    } catch (requestError) {
      setJobsError(requestError.message);
    } finally {
      setMatchingJobId("");
    }
  };

  const handleMatchCandidateToJob = async ({ candidateId, jobDescriptionId }) => {
    const data = await matchSelectedJobCandidates({
      candidateIds: [candidateId],
      jobDescriptionId
    });
    const updatedCandidate = data.candidates.find((candidate) => candidate._id === candidateId);

    if (updatedCandidate) {
      setCandidates((currentCandidates) =>
        currentCandidates.map((candidate) =>
          candidate._id === updatedCandidate._id ? updatedCandidate : candidate
        )
      );
      setSelectedDirectoryCandidate((currentCandidate) =>
        currentCandidate?._id === updatedCandidate._id ? updatedCandidate : currentCandidate
      );
    }

    return updatedCandidate;
  };

  const handleCreateUser = async ({ password, role, userId }) => {
    setCreateUserError("");
    setUserActionError("");
    setIsCreatingUser(true);

    try {
      await createUser({
        password,
        role,
        requestingUserId: authenticatedUser.userId,
        userId
      });
      await loadUsers();
    } catch (requestError) {
      setCreateUserError(requestError.message);
      throw requestError;
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async ({ isLocked, newUserId, password, role, userId }) => {
    setUserActionError("");
    setUpdatingUserId(userId);

    try {
      const data = await updateUser({
        isLocked,
        newUserId,
        password,
        requestingUserId: authenticatedUser.userId,
        role,
        userId
      });

      if (userId === authenticatedUser.userId && data.user) {
        onAuthenticatedUserChange(data.user);
        setUsers((currentUsers) =>
          currentUsers.map((user) => (user.userId === userId ? data.user : user))
        );
        return;
      }

      await loadUsers();
    } catch (requestError) {
      setUserActionError(requestError.message);
      throw requestError;
    } finally {
      setUpdatingUserId("");
    }
  };

  const handleDeleteUser = async (userId) => {
    setUserActionError("");
    setDeletingUserId(userId);

    try {
      await deleteUser({
        requestingUserId: authenticatedUser.userId,
        userId
      });

      if (userId === authenticatedUser.userId) {
        onLogout();
        return;
      }

      setUsers((currentUsers) => currentUsers.filter((user) => user.userId !== userId));
    } catch (requestError) {
      setUserActionError(requestError.message);
      throw requestError;
    } finally {
      setDeletingUserId("");
    }
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    await changeOwnPassword({
      currentPassword,
      newPassword,
      userId: authenticatedUser.userId
    });
  };

  const activeProfileScore =
    activeView === "candidates"
      ? selectedDirectoryCandidate?.profile_score
      : result?.candidate?.profile_score || result?.profile_score;
  const selectedJobDescription = jobDescriptions.find(
    (jobDescription) => jobDescription._id === selectedJobDescriptionId
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-950 lg:pb-0">
      <Sidebar
        activeView={activeView}
        candidateCount={candidates.length}
        onViewChange={setActiveView}
        userRole={authenticatedUser?.role}
      />

      <div className="lg:pl-72">
        <DashboardHeader
          authenticatedUser={authenticatedUser}
          candidateName={result?.candidate?.name}
          onChangePassword={handleChangePassword}
          onLogout={onLogout}
          profileScore={activeProfileScore}
          subtitle={
            activeView === "candidates"
              ? "Candidate Database"
              : activeView === "jobs"
                ? "Job Description Matching"
                : activeView === "settings"
                  ? "Admin Console"
                  : "Candidate Insight Dashboard"
          }
          title={
            activeView === "candidates"
              ? "Parsed CV Library"
              : activeView === "jobs"
                ? "Job Match Center"
                : activeView === "settings"
                  ? "Settings"
                  : undefined
          }
        />

        {activeView === "candidates" ? (
          <CandidateDirectory
            candidates={candidates}
            deleteError={deleteCandidateError}
            deleteJobMatchError={deleteJobMatchError}
            deletingJobMatchKey={deletingJobMatchKey}
            error={candidatesError}
            isDeleting={Boolean(deletingCandidateId)}
            isLoading={isCandidatesLoading}
            jobDescriptions={jobDescriptions}
            onClearDeleteError={() => setDeleteCandidateError("")}
            onClearDeleteJobMatchError={() => setDeleteJobMatchError("")}
            onDeleteCandidate={handleDeleteCandidate}
            onDeleteCandidateJobMatch={handleDeleteCandidateJobMatch}
            onMatchCandidateToJob={handleMatchCandidateToJob}
            onRefresh={loadCandidates}
            onSelectedCandidateChange={setSelectedDirectoryCandidate}
          />
        ) : activeView === "jobs" ? (
          <JobsBoard
            candidates={candidates}
            error={jobsError}
            deletingJobDescriptionId={deletingJobDescriptionId}
            isLoading={isJobsLoading}
            isMatching={Boolean(matchingJobId)}
            isShortlisting={Boolean(shortlistingJobId)}
            isUploading={isJobUploading}
            jobDescriptions={jobDescriptions}
            onCreateJobDescriptionFromText={handleCreateJobDescriptionFromText}
            onFindCandidates={handleFindJobCandidates}
            onDeleteJobDescription={handleDeleteJobDescription}
            onMatchSelectedCandidates={handleMatchSelectedJobCandidates}
            onRefresh={loadJobDescriptions}
            onUpdateJobDescriptionTitle={handleUpdateJobDescriptionTitle}
            onUploadJobDescription={handleUploadJobDescription}
            shortlistsByJobId={shortlistsByJobId}
          />
        ) : activeView === "settings" ? (
          <SettingsPanel
            authenticatedUser={authenticatedUser}
            createUserError={createUserError || usersError || userActionError}
            deletingUserId={deletingUserId}
            isCreatingUser={isCreatingUser}
            isLoadingUsers={isUsersLoading}
            onDeleteUser={handleDeleteUser}
            onCreateUser={handleCreateUser}
            onLoadUsers={loadUsers}
            onUpdateUser={handleUpdateUser}
            updatingUserId={updatingUserId}
            users={users}
          />
        ) : (
          <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
            <UploadPanel
              error={error}
              file={file}
              isLoading={isLoading}
              jobDescriptions={jobDescriptions}
              onFileChange={setFile}
              onJobDescriptionChange={setSelectedJobDescriptionId}
              onSubmit={handleSubmit}
              selectedJobDescriptionId={selectedJobDescriptionId}
            />

            <InsightsGrid
              isLoading={isLoading}
              jobDescription={selectedJobDescription}
              result={result}
            />
          </main>
        )}
      </div>
    </div>
  );
};

export default CandidateInsightDashboard;
