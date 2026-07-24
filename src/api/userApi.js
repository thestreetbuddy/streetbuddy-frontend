import api from './axios';

export const getUsers = () => {
  return api.get('/users');
};

export const getUser = (id) => {
  return api.get(`/users/${id}`);
};

export const createUser = (data) => {
  return api.post('/users', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateUser = (id, data) => {
  return api.patch(`/users/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateUserStatus = (id, data) => {
  return api.patch(`/users/${id}/status`, data);
};

export const deleteUser = (id) => {
  return api.delete(`/users/${id}`);
};
