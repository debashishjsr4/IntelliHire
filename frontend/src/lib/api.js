const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");

export const parseResume = async ({ file, name, email }) => {
  const formData = new FormData();
  formData.append("resume", file);

  if (name) {
    formData.append("name", name);
  }

  if (email) {
    formData.append("email", email);
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/resumes/parse`, {
      method: "POST",
      body: formData
    });
  } catch {
    throw new Error(
      `Cannot reach the IntelliHire API at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Resume parsing failed.");
  }

  return data;
};
