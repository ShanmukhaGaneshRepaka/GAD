import axios from "axios";
import { apiUrl } from "./ApplicantAPIService.js";

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
  response => response, 
  async error => {
    const originalRequest = error.config;

    // Check if the error is due to an unauthorized access 
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken'); 
        console.log('Attempting to refresh token with refresh token:', refreshToken);
        // Make a request to your auth server to refresh the token.
        const response = await axios.post(`${apiUrl}/applicant/refreshToken`, {
          token: refreshToken,
        });
        const { jwt:accessToken, refreshToken: newRefreshToken } = response.data.data;


        // Store the new access and refresh tokens.
        localStorage.setItem('jwtToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update the authorization header with the new access token.
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return apiClient(originalRequest); 
        
      } catch (refreshError) {
        // Handle refresh token errors by clearing stored tokens and redirecting to the login page.
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/candidate'; 
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error); 
  }
);

export default apiClient;