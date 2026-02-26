import api from './api';

export const cargoService = {
  list: (params?: Record<string, string>) => api.get('/cargo', { params }),
  get: (id: string) => api.get(`/cargo/${id}`),
  create: (data: unknown) => api.post('/cargo', data),
  bulkCreate: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/cargo/bulk', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  submit: (id: string) => api.put(`/cargo/${id}/submit`),
  accept: (id: string) => api.put(`/cargo/${id}/accept`),
  setFare: (id: string, fare: number) => api.put(`/cargo/${id}/set-fare`, { fare }),
  cancel: (id: string, note?: string) => api.put(`/cargo/${id}/cancel`, { note }),
  setStatus: (id: string, status: string, note?: string) => api.put(`/cargo/${id}/set-status`, { status, note }),
  reject: (id: string, note?: string) => api.put(`/cargo/${id}/reject`, { note }),
  getDriverRequests: (id: string) => api.get(`/cargo/${id}/driver-requests`),
};
