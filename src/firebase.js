import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbmIwAsRcT57XJgGj_mDyht5OuZ1Trk98",
  authDomain: "gerentrack-b88b5.firebaseapp.com",
  projectId: "gerentrack-b88b5",
  storageBucket: "gerentrack-b88b5.firebasestorage.app",
  messagingSenderId: "124815557463",
  appId: "1:124815557463:web:853c0be469ce9a11e3412"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, doc, setDoc, onSnapshot };
