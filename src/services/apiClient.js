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
    const jwtToken = localStorage.getItem("jwtToken"); 
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
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

    // Fix 3: Prevent infinite loops if the refresh call itself fails with 401
    if (originalRequest.url.includes('/refreshToken')) {
      return Promise.reject(error);
    }
    if (
  originalRequest.url.includes("/applicantLogin") ||
  originalRequest.url.includes("/oauth2") ||
  originalRequest.url.includes("/refreshToken")
) {
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
        const refreshToken = localStorage.getItem('refreshToken');

        // Fix 2: Safety check before calling API
        if (!refreshToken) {
          isRefreshing = false;
          window.location.href = '/candidate';
          return reject(error);
        }

        axios.post(`${apiUrl}/applicant/refreshToken`, { token: refreshToken })
          .then((response) => {
            const { jwt: accessToken, refreshToken: newRefreshToken } = response.data.data;
            localStorage.setItem('jwtToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            onRefreshed(accessToken);
            isRefreshing = false;

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            resolve(apiClient(originalRequest));
          })
          .catch((refreshError) => {
            isRefreshing = false;
            refreshSubscribers = [];
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/candidate';
            reject(refreshError);
          });
      });
    }
    return Promise.reject(error);
  }
);
export default apiClient;