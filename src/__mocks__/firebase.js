/**
 * Mock completo do src/firebase.js para testes de componentes.
 * Todos os exports são vi.fn() ou objetos stub.
 */
import { vi } from 'vitest';

// Objetos stub
export const db = {};
export const auth = { currentUser: null };
export const secondaryAuth = {};
export const storage = {};
export const functions = {};
export const googleProvider = {};
export const EmailAuthProvider = { credential: vi.fn() };

// Firestore
export const doc = vi.fn();
export const setDoc = vi.fn().mockResolvedValue(undefined);
export const getDoc = vi.fn().mockResolvedValue({ exists: () => false, data: () => null });
export const deleteDoc = vi.fn().mockResolvedValue(undefined);
export const collection = vi.fn();
export const onSnapshot = vi.fn(() => vi.fn()); // retorna unsubscribe
export const writeBatch = vi.fn(() => ({
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
}));
export const runTransaction = vi.fn().mockResolvedValue(undefined);

// Auth
export const createUserWithEmailAndPassword = vi.fn().mockResolvedValue({ user: { uid: 'mock-uid', email: 'mock@test.com' } });
export const signInWithEmailAndPassword = vi.fn().mockResolvedValue({ user: { uid: 'mock-uid', email: 'mock@test.com' } });
export const signOut = vi.fn().mockResolvedValue(undefined);
export const sendPasswordResetEmail = vi.fn().mockResolvedValue(undefined);
export const updatePassword = vi.fn().mockResolvedValue(undefined);
export const onAuthStateChanged = vi.fn(() => vi.fn());
export const sendEmailVerification = vi.fn().mockResolvedValue(undefined);
export const reauthenticateWithCredential = vi.fn().mockResolvedValue(undefined);

// Storage
export const storageRef = vi.fn();
export const uploadBytes = vi.fn().mockResolvedValue({});
export const getDownloadURL = vi.fn().mockResolvedValue('https://mock-url.com/file');
export const deleteObject = vi.fn().mockResolvedValue(undefined);
export const getBlob = vi.fn().mockResolvedValue(new Blob());

// Google Auth
export const signInWithPopup = vi.fn().mockResolvedValue({ user: { uid: 'mock-uid' } });
export const signInWithRedirect = vi.fn().mockResolvedValue(undefined);
export const getRedirectResult = vi.fn().mockResolvedValue(null);
export const linkWithPopup = vi.fn().mockResolvedValue({ user: { uid: 'mock-uid' } });
export const unlink = vi.fn().mockResolvedValue({ uid: 'mock-uid' });

// Cloud Functions
export const httpsCallable = vi.fn(() => vi.fn().mockResolvedValue({ data: {} }));
