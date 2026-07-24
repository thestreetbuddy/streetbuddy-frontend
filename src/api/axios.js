import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://localhost:4000',
  baseURL: 'http://64.227.186.8:4000',

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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
