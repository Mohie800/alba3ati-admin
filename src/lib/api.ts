import axios from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Skip the auto-toast on error. Use when the page already renders the error inline. */
    suppressToast?: boolean;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Extract a readable error message
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === "ECONNABORTED"
        ? "Request timed out"
        : !error.response
          ? "Network error — check your connection"
          : `Error ${status}`);

    // Attach readable message for consumers
    error.userMessage = message;

    if (typeof window !== "undefined") {
      if (status === 401) {
        localStorage.removeItem("admin_token");
        window.dispatchEvent(new Event("admin-auth-expired"));
      } else if (!error.config?.suppressToast) {
        // Auto-toast mutation failures only — list GETs render their own
        // ErrorState card and would double up.
        const method = (error.config?.method || "get").toLowerCase();
        if (method !== "get") {
          window.dispatchEvent(
            new CustomEvent("admin-toast", {
              detail: { message, variant: "error" },
            }),
          );
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
