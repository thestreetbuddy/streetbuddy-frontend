import api from './axios';

export const getAdminProfile = () => {
  return api.get('/admin/profile', {
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
    params: {
      _t: Date.now(),
    },
  });
};
