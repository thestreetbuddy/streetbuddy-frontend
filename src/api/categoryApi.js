import api from './axios';

export const getCategories = () => {
  return api.get('/categories');
};

export const getCategory = (id) => {
  return api.get(`/categories/${id}`);
};

export const createCategory = (data) => {
  return api.post('/categories', data);
};

export const updateCategory = (id, data) => {
  // Backend expects multipart/form-data for updates with images
  return api.patch(`/categories/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteCategory = (id) => {
  return api.delete(`/categories/${id}`);
};

export const updateCategoryStatus = (id, data) => {
  return api.patch(`/categories/${id}`, data);
};
