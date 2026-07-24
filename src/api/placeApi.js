import api from './axios';

export const getPlaces = () => {
  return api.get('/places');
};

export const getPlace = (id) => {
  return api.get(`/places/${id}`);
};

export const createPlace = (data) => {
  return api.post('/places', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updatePlace = (id, data) => {
  return api.patch(`/places/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deletePlace = (id) => {
  return api.delete(`/places/${id}`);
};
