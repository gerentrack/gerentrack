import { initializeApp } from "firebase/app";
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
  appId: "1:124815557463:web:853c0be469ce9a11e3412",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

export {
  // Firestore — existentes
  db, doc, setDoc, onSnapshot,
  // Firestore — novos
  collection, getDoc, deleteDoc, writeBatch,
  // Auth
  auth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updatePassword, onAuthStateChanged,
};
