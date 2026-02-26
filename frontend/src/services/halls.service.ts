import api from './api';

export const hallsService = {
  list: (params?: Record<string, string>) => api.get('/halls', { params }),
  get: (id: string) => api.get(`/halls/${id}`),
  create: (data: unknown) => api.post('/halls', data),
  update: (id: string, data: unknown) => api.put(`/halls/${id}`, data),
  delete: (id: string) => api.delete(`/halls/${id}`),
};

export const terminalsService = {
  list: () => api.get('/terminals'),
  get: (id: string) => api.get(`/terminals/${id}`),
  create: (data: unknown) => api.post('/terminals', data),
  update: (id: string, data: unknown) => api.put(`/terminals/${id}`, data),
};

export const announcementsService = {
  list: (params?: Record<string, string>) => api.get('/announcements', { params }),
  create: (data: unknown) => api.post('/announcements', data),
  suspend: (id: string, note?: string) => api.put(`/announcements/${id}/suspend`, { note }),
  resume: (id: string) => api.put(`/announcements/${id}/resume`),
};
