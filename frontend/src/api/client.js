import axios from "axios";

export const TOKEN_KEY = "stockflow_token";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/signup");
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export default api;

const cleanMsg = (m = "") => m.replace(/^Value error, /, "");

/** Human-readable message from an Axios/FastAPI error. */
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (!err.response) return "Cannot reach the server. Check that the backend is running.";
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => {
        const field = (e.loc || []).filter((p) => p !== "body").join(".");
        return field ? `${field}: ${cleanMsg(e.msg)}` : cleanMsg(e.msg);
      })
      .join(" · ");
  }
  return fallback;
}

/** Map FastAPI 422 errors to { fieldName: message }. */
export function fieldErrors(err) {
  const detail = err.response?.data?.detail;
  const out = {};
  if (err.response?.status === 422 && Array.isArray(detail)) {
    detail.forEach((e) => {
      const field = e.loc?.[e.loc.length - 1];
      if (typeof field === "string" && e.loc.length > 1) out[field] = cleanMsg(e.msg);
    });
  }
  return out;
}