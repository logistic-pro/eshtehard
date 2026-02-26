import api from './api';

export const appointmentsService = {
  list: (params?: Record<string, string>) => api.get('/appointments', { params }),
  get: (id: string) => api.get(`/appointments/${id}`),
  // Driver requests a cargo
  requestCargo: (cargoId: string) => api.post('/appointments/request', { cargoId }),
  // Freight approves with optional note (date comes from cargo.loadingDateTime)
  approve: (id: string, data: { note?: string }) => api.put(`/appointments/${id}/approve`, data),
  // Freight rejects
  reject: (id: string) => api.put(`/appointments/${id}/reject`),
  // Driver cancels their appointment
  cancelByDriver: (id: string) => api.put(`/appointments/${id}/cancel`),
  // Driver updates cargo status
  driverUpdateStatus: (id: string, status: 'IN_TRANSIT' | 'DELIVERED') => api.put(`/appointments/${id}/driver-status`, { status }),
  // Admin lifts driver ban
  liftDriverBan: (driverId: string) => api.put(`/appointments/drivers/${driverId}/lift-ban`),
};
