import api from './api';

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (userData) =>
    api.post('/auth/register', userData),

  completeRegistration: (token, password) =>
    api.post('/auth/complete-registration', { token, password }),

  getMe: () =>
    api.get('/auth/me'),

  changePassword: (oldPassword, newPassword) =>
    api.put('/auth/password', { oldPassword, newPassword }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
