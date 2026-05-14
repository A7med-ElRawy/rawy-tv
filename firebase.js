import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAkOrp_bZt_SYfMtsUQozO4vpQxJMvx6Xo",
  authDomain: "movieshub-97784.firebaseapp.com",
  projectId: "movieshub-97784",
  storageBucket: "movieshub-97784.firebasestorage.app",
  messagingSenderId: "83594990602",
  appId: "1:83594990602:web:2198667908c2e26a18bbf3",
  measurementId: "G-VQQMJ7ZXD7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
