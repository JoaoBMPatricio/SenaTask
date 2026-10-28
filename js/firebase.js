// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApkyCmh1yo8_3b-Qbygg_VWkvGdMYZtWw",
  authDomain: "senatask-93a95.firebaseapp.com",
  projectId: "senatask-93a95",
  storageBucket: "senatask-93a95.firebasestorage.app",
  messagingSenderId: "60816551503",
  appId: "1:60816551503:web:185779b02ed4a2799c043a",
  measurementId: "G-288G6WQ98S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);