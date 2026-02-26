import api from './api';

export const driversService = {
  list: (params?: Record<string, string>) => api.get('/drivers', { params }),
  get: (id: string) => api.get(`/drivers/${id}`),
  create: (data: unknown) => api.post('/drivers', data),
  update: (id: string, data: unknown) => api.put(`/drivers/${id}`, data),
};

export const fleetService = {
  list: (params?: Record<string, string>) => api.get('/fleet', { params }),
  create: (data: unknown) => api.post('/fleet', data),
  update: (id: string, data: unknown) => api.put(`/fleet/${id}`, data),
  delete: (id: string) => api.delete(`/fleet/${id}`),
};
