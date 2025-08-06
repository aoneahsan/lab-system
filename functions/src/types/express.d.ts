import * as admin from 'firebase-admin';

declare global {
  namespace Express {
    interface Request {
      auth?: admin.auth.DecodedIdToken;
    }
  }
}