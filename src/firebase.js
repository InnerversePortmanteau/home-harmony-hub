// src/firebase.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth'; // Added connectAuthEmulator and GoogleAuthProvider
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'; // Added connectFirestoreEmulator

// Your web app's Firebase configuration
// (Replace with your actual Firebase project configuration from the Firebase Console)

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

// --- Add this block for emulator connection ---
if (window.location.hostname === "localhost") {
  connectFirestoreEmulator(db, 'localhost', 9098); // Use Firestore port 9098
  connectAuthEmulator(auth, 'http://localhost:9099'); // Use Auth port 9099
  console.log("Connected to Firebase Emulators!");
}
// --- End emulator connection block ---

export default app;
