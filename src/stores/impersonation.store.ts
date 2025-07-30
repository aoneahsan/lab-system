import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user.types';

interface ImpersonationState {
  isImpersonating: boolean;
  originalUser: User | null;
  impersonatedUser: User | null;
  startImpersonation: (user: User, originalUser: User) => void;
  endImpersonation: () => void;
  clearImpersonation: () => void;
}

export const useImpersonationStore = create<ImpersonationState>()(
  persist(
    (set) => ({
      isImpersonating: false,
      originalUser: null,
      impersonatedUser: null,

      startImpersonation: (user: User, originalUser: User) => {
        set({
          isImpersonating: true,
          originalUser,
          impersonatedUser: user,
        });
      },

      endImpersonation: () => {
        set({
          isImpersonating: false,
          originalUser: null,
          impersonatedUser: null,
        });
      },

      clearImpersonation: () => {
        set({
          isImpersonating: false,
          originalUser: null,
          impersonatedUser: null,
        });
      },
    }),
    {
      name: 'labflow-impersonation',
    }
  )
);