import api from './axios';

export const getAdminProfile = () => {
  return api.get('/admin/profile', {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Expires: '0',
    },
    params: {
      _t: Date.now(),
    },
  });
};

export const updateAdminProfile = (data) => {
  return api.patch('/admin/profile', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDashboardStats = () => {
  return api.get('/admin/dashboard', {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Expires: '0',
    },
    params: {
      _t: Date.now(),
    },
  });
};
