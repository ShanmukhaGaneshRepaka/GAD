import axios from "axios";
import { apiUrl } from "./ApplicantAPIService.js";


let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {

  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Create an Axios instance with default configuration
const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor to add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const requestUrl = config.url || "";

    // Do NOT attach a token to auth endpoints — a stale/expired token in
    // localStorage would cause the backend to return 401 on a fresh login.
    const isAuthEndpoint =
      requestUrl.includes("/applicantLogin") ||
      requestUrl.includes("/refreshToken");

    if (!isAuthEndpoint) {
      const jwtToken = localStorage.getItem("jwtToken");
      if (jwtToken) {
        config.headers.Authorization = `Bearer ${jwtToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response: { status } = {} } = error;
    const originalRequest = config;

    // If there's no config (network-level error), surface the error immediately
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    // Never attempt a token refresh for auth-related endpoints.
    // This covers: normal login, google login (both hit /applicantLogin),
    // and the refresh token endpoint itself (prevent infinite loop).
    const isAuthEndpoint =
      requestUrl.includes("/applicantLogin") ||
      requestUrl.includes("/refreshToken");

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      return new Promise((resolve, reject) => {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          isRefreshing = false;
          window.location.href = "/candidate";
          return reject(error);
        }

        axios
          .post(`${apiUrl}/applicant/refreshToken`, { token: refreshToken })
          .then((response) => {
            const { jwt: accessToken, refreshToken: newRefreshToken } =
              response.data.data;
            localStorage.setItem("jwtToken", accessToken);
            localStorage.setItem("refreshToken", newRefreshToken);

            apiClient.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${accessToken}`;

            onRefreshed(accessToken);
            isRefreshing = false;

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            resolve(apiClient(originalRequest));
          })
          .catch((refreshError) => {
            isRefreshing = false;
            refreshSubscribers = [];
            localStorage.removeItem("jwtToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/candidate";
            reject(refreshError);
          });
      });
    }

    return Promise.reject(error);
  }
);
export default apiClient;