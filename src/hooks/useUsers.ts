import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}