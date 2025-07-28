// Re-export commonly used Firebase services
export {
  auth,
  firestore as db, // Alias firestore as db for shorter imports
  storage,
  functions,
  performance,
  analytics,
} from './firebase.config';

export { default as app } from './firebase.config';
