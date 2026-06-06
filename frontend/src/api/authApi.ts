import { User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return { user: data.data.user, token: data.data.token };
  },

  signup: async (userData: Partial<User>): Promise<{ user: User; token: string }> => {
    const res = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Signup failed');
    return { user: data.data.user, token: data.data.token };
  },

  me: async (token: string): Promise<User> => {
    const res = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to authenticate');
    return data.data.user;
  },

  forgotPassword: async (email: string): Promise<void> => {
    const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to request password reset');
  },

  verifyOtp: async (email: string, otp: string): Promise<void> => {
    const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid or expired OTP');
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<void> => {
    const res = await fetch('http://localhost:5000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to reset password');
  }
};
