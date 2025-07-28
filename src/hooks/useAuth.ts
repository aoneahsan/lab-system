import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import type { SystemRole } from '@/constants/tenant.constants';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: SystemRole;
  tenantId: string;
  phoneNumber?: string;
}

export function useLogin() {
  const { setCurrentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ email, password }: LoginCredentials) => 
      authService.login(email, password),
    onSuccess: (user) => {
      setCurrentUser(user);
      toast.success('Login successful');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });
}

export function useRegister() {
  const { setCurrentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (user) => {
      setCurrentUser(user);
      toast.success('Registration successful');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast.success('Logged out successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Logout failed');
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => 
      authService.resetPassword(email),
    onSuccess: () => {
      toast.success('Password reset email sent');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reset email');
    },
  });
}