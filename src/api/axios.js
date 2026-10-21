import axios from 'axios';

const rawBaseURL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'https://api.thestreetbuddy.com';

const baseURL = rawBaseURL.replace(/\/+$/, '');

const api = axios.create({
  baseURL,
});

let activeRequests = 0;
let loaderTimer = null;

const startLoader = () => {
  if (activeRequests === 0) {
    clearTimeout(loaderTimer);
    window.dispatchEvent(new Event('show-global-loader'));
  }
  activeRequests++;
};

const stopLoader = () => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    // Chota sa delay lagaya taaki page navigation ke time loader hide/show ka flicker na kare
    loaderTimer = setTimeout(() => {
      if (activeRequests === 0) {
        window.dispatchEvent(new Event('hide-global-loader'));
      }
    }, 300);
  }
};

api.interceptors.request.use(
  (config) => {
    startLoader();
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    stopLoader();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    stopLoader();
    return response;
  },
  (error) => {
    stopLoader();

    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.includes('/login');
    const isAlreadyOnLoginPage =
      typeof window !== 'undefined' &&
      (window.location.pathname.endsWith('/login') ||
        window.location.pathname.includes('/admin/login') ||
        window.location.pathname === '/login');

    // Only redirect to login if user was authorized and session expired on an internal route
    if (error.response?.status === 401 && !isLoginRequest && !isAlreadyOnLoginPage) {
      localStorage.removeItem('token');
      const loginPath =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
          ? '/admin/login'
          : '/login';
      window.location.href = loginPath;
    }

    return Promise.reject(error);
  }
);

export default api;
