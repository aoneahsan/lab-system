import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import type { User } from '@/types/auth.types';

const PROJECT_PREFIX = 'labflow_';
const USERS_COLLECTION = `${PROJECT_PREFIX}users`;

export function useUsers(role?: string) {
  return useQuery({
    queryKey: ['users', role],
    queryFn: async () => {
      let q = query(collection(db, USERS_COLLECTION));
      
      if (role) {
        q = query(q, where('role', '==', role));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : data.lastLoginAt,
        } as User;
      });
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}