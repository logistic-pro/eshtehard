import api from './api';

export const reportsService = {
  dashboard: () => api.get('/reports/dashboard'),
  cargoSummary: () => api.get('/reports/cargo-summary'),
  driverPerformance: (limit?: number) => api.get('/reports/driver-performance', { params: { limit } }),
  hallActivity: () => api.get('/reports/hall-activity'),
};
