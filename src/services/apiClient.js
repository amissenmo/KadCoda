import axios from 'axios';

const ACCESS_TOKEN_STORAGE_KEY = 'kadcoda_access_token';

let inMemoryAccessToken =
  typeof window !== 'undefined'
    ? window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    : null;

const getAccessToken = () => {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }
  if (typeof window !== 'undefined') {
    inMemoryAccessToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  }
  return inMemoryAccessToken;
};

const setAccessToken = (token) => {
  inMemoryAccessToken = token || null;
  if (typeof window !== 'undefined') {
    if (token) {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  }
};

const clearAccessToken = () => {
  setAccessToken(null);
};

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, application/problem+json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedRequestsQueue = [];

const processQueue = (error, token = null) => {
  failedRequestsQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedRequestsQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';
    if (
      originalRequest._retry ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedRequestsQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newAccessToken = refreshResponse.data?.access_token;
      if (!newAccessToken) {
        throw new Error('Refresh response did not include access_token');
      }

      setAccessToken(newAccessToken);
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      processQueue(refreshError, null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kadcoda:auth-expired'));
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export { apiClient, clearAccessToken, getAccessToken, setAccessToken };
export default apiClient;
