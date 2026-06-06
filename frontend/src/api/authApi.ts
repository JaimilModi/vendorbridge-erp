import { mockDb, delay } from './mockDb';
import { User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    await delay();
    const user = mockDb.users.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    // Simple mock token
    const token = `mock_jwt_${user.id}_${Date.now()}`;
    return { user, token };
  },

  signup: async (data: Partial<User>): Promise<{ user: User; token: string }> => {
    await delay();
    if (mockDb.users.some(u => u.email === data.email)) {
      throw new Error('Email already in use');
    }
    
    const newUser: User = {
      id: `u${mockDb.users.length + 1}`,
      email: data.email!,
      fullName: data.fullName!,
      role: data.role || 'vendor',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockDb.users.push(newUser);
    const token = `mock_jwt_${newUser.id}_${Date.now()}`;
    return { user: newUser, token };
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
