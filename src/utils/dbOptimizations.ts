import { collection, query, where, orderBy, limit, startAfter, DocumentSnapshot, Query, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { memoize } from './performance';

// Pagination helper with cursor-based pagination
export async function paginatedQuery<T>(
  baseQuery: Query,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
) {
  let paginatedQuery = query(baseQuery, limit(pageSize));
  
  if (lastDoc) {
    paginatedQuery = query(paginatedQuery, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(paginatedQuery);
  const items: T[] = [];
  let lastDocument: DocumentSnapshot | undefined;
  
  snapshot.forEach(doc => {
    items.push({ id: doc.id, ...doc.data() } as T);
    lastDocument = doc;
  });
  
  return {
    items,
    lastDocument,
    hasMore: snapshot.size === pageSize,
  };
}

// Optimized count query
export async function getOptimizedCount(
  collectionName: string,
  constraints?: any[]
) {
  const ref = collection(db, collectionName);
  let q = query(ref);
  
  if (constraints) {
    q = query(ref, ...constraints);
  }
  
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

// Batch fetch with field selection
export async function batchFetchWithFields<T>(
  collectionName: string,
  ids: string[],
  fields: (keyof T)[]
): Promise<Partial<T>[]> {
  // Split into batches of 10 (Firestore 'in' query limit)
  const batches = [];
  for (let i = 0; i < ids.length; i += 10) {
    batches.push(ids.slice(i, i + 10));
  }
  
  const results: Partial<T>[] = [];
  
  for (const batch of batches) {
    const q = query(
      collection(db, collectionName),
      where('__name__', 'in', batch)
    );
    
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      const filtered: Partial<T> = { id: doc.id } as any;
      
      // Only include requested fields
      fields.forEach(field => {
        if (field in data) {
          (filtered as any)[field] = data[field as string];
        }
      });
      
      results.push(filtered);
    });
  }
  
  return results;
}

// Indexed query builder
export class IndexedQueryBuilder<T> {
  private constraints: any[] = [];
  private indexHints: string[] = [];
  
  constructor(private collectionName: string) {}
  
  whereEquals(field: keyof T, value: any) {
    this.constraints.push(where(field as string, '==', value));
    this.indexHints.push(`${field as string}_asc`);
    return this;
  }
  
  whereIn(field: keyof T, values: any[]) {
    this.constraints.push(where(field as string, 'in', values));
    this.indexHints.push(`${field as string}_asc`);
    return this;
  }
  
  whereRange(field: keyof T, min: any, max: any) {
    this.constraints.push(
      where(field as string, '>=', min),
      where(field as string, '<=', max)
    );
    this.indexHints.push(`${field as string}_asc`);
    return this;
  }
  
  orderByField(field: keyof T, direction: 'asc' | 'desc' = 'asc') {
    this.constraints.push(orderBy(field as string, direction));
    this.indexHints.push(`${field as string}_${direction}`);
    return this;
  }
  
  limitTo(count: number) {
    this.constraints.push(limit(count));
    return this;
  }
  
  build() {
    const ref = collection(db, this.collectionName);
    return query(ref, ...this.constraints);
  }
  
  getIndexHint() {
    return {
      collection: this.collectionName,
      fields: this.indexHints,
      hint: `Create composite index: ${this.indexHints.join(', ')}`,
    };
  }
}

// Cache frequently accessed data
const cacheConfig = {
  users: 300, // Cache up to 300 users
  tests: 500, // Cache up to 500 tests
  referenceRanges: 1000, // Cache up to 1000 reference ranges
};

export const cachedGetUser = memoize(
  async (userId: string) => {
    const userDoc = await getDocs(
      query(collection(db, 'users'), where('__name__', '==', userId), limit(1))
    );
    return userDoc.empty ? null : { id: userDoc.docs[0].id, ...userDoc.docs[0].data() };
  },
  cacheConfig.users
);

export const cachedGetTest = memoize(
  async (testId: string) => {
    const testDoc = await getDocs(
      query(collection(db, 'tests'), where('__name__', '==', testId), limit(1))
    );
    return testDoc.empty ? null : { id: testDoc.docs[0].id, ...testDoc.docs[0].data() };
  },
  cacheConfig.tests
);

// Prefetch related data
export async function prefetchRelatedData<T>(
  mainData: T[],
  relations: {
    field: keyof T;
    collection: string;
    cacheKey?: string;
  }[]
) {
  const prefetchPromises = relations.map(async (relation) => {
    const ids = [...new Set(mainData.map(item => item[relation.field]).filter(Boolean))] as string[];
    
    if (ids.length === 0) return;
    
    // Use cached fetch if available
    if (relation.cacheKey === 'user') {
      await Promise.all(ids.map(id => cachedGetUser(id)));
    } else if (relation.cacheKey === 'test') {
      await Promise.all(ids.map(id => cachedGetTest(id)));
    } else {
      // Regular batch fetch
      await batchFetchWithFields(relation.collection, ids, ['name', 'code']);
    }
  });
  
  await Promise.all(prefetchPromises);
}

// Query optimizer suggestions
export function analyzeQuery(collectionName: string, filters: any[], orderByFields: string[]) {
  const suggestions: string[] = [];
  
  // Check for missing indexes
  if (filters.length > 1 || (filters.length > 0 && orderByFields.length > 0)) {
    suggestions.push(
      `Consider creating a composite index for ${collectionName} with fields: ${[...filters.map(f => f.field), ...orderByFields].join(', ')}`
    );
  }
  
  // Check for inefficient queries
  if (filters.some(f => f.operator === '!=')) {
    suggestions.push(
      'Avoid using != operator. Consider using "in" with excluded values or restructuring the query.'
    );
  }
  
  if (filters.some(f => f.operator === 'array-contains-any') && filters.length > 1) {
    suggestions.push(
      'array-contains-any cannot be combined with other array queries. Consider restructuring.'
    );
  }
  
  // Check for pagination
  if (!filters.some(f => f.type === 'limit')) {
    suggestions.push(
      'Consider adding pagination with limit() to improve performance for large datasets.'
    );
  }
  
  return suggestions;
}