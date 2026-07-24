// src/api/cityApi.js
import api from './axios';

export const getCities = () => {
  return api.get('/cities');
};

export const getCity = (id) => {
  return api.get(`/cities/${id}`);
};

export const createCity = (data) => {
  // Backend expects multipart/form-data for creates with images
  return api.post('/cities', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateCity = (id, data) => {
  // Backend expects multipart/form-data for updates with images, using POST with _method=PATCH
  data.append('_method', 'PATCH');
  return api.patch(`/cities/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteCity = (id) => {
  return api.delete(`/cities/${id}`);
};