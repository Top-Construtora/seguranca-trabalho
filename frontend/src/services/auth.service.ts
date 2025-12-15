import { api } from './api';

interface ChangePasswordData {
  currentPassword?: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'avaliador';
    must_change_password: boolean;
  };
}

class AuthService {
  async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  }
}

export const authService = new AuthService();
