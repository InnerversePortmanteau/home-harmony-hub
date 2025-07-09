// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqhhuhdgOcLAdRiIpN98Lk8R_QPZHuN5w",
  authDomain: "home-harmony-hub-9d77e.firebaseapp.com",
  projectId: "home-harmony-hub-9d77e",
  storageBucket: "home-harmony-hub-9d77e.firebasestorage.app",
  messagingSenderId: "826187079628",
  appId: "1:826187079628:web:757065a63f29cc19cd8769"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
