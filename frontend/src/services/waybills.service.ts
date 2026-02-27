import api from './api';

export const waybillsService = {
  list: (params?: Record<string, string>) => api.get('/waybills', { params }),
  get: (id: string) => api.get(`/waybills/${id}`),
  create: (appointmentId: string) => api.post('/waybills', { appointmentId }),
  downloadPdf: async (id: string, waybillNumber?: string) => {
    const res = await api.get(`/waybills/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `waybill-${waybillNumber ?? id}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },
};
