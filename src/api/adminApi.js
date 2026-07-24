import api from './axios';

export const getAdminProfile = () => {
  return api.get('/admin/profile');
};

export const updateAdminProfile = (data) => {
  return api.patch('/admin/profile', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDashboardStats = () => {
  return api.get('/admin/dashboard');
};
