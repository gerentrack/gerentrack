import { initializeApp } from "firebase/app";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDbmIwAsRcT57XJgGj_mDyht5OuZ1Trk98",
  authDomain: "gerentrack-b88b5.firebaseapp.com",
  projectId: "gerentrack-b88b5",
  storageBucket: "gerentrack-b88b5.firebasestorage.app",
  messagingSenderId: "124815557463",
  appId: "1:124815557463:web:853c0be469ce9a112e3412",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Segunda instância exclusiva para criar contas sem afetar a sessão atual
const secondaryApp = initializeApp(firebaseConfig, "secondary");
const secondaryAuth = getAuth(secondaryApp);

export {
  // Firestore — existentes
  db, doc, setDoc, onSnapshot,
  // Firestore — novos
  collection, getDoc, deleteDoc, writeBatch,
  // Auth
  auth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updatePassword, onAuthStateChanged,
  // Storage
  storage, storageRef, uploadBytes, getDownloadURL, deleteObject,
  // Auth secundário (criar contas sem deslogar o usuário atual)
  secondaryAuth,
};
