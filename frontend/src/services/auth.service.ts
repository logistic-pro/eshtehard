import api from './api';

export const authService = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, code: string) => api.post('/auth/verify-otp', { phone, code }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
};
