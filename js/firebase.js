import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyApkyCmh1yo8_3b-Qbygg_VWkvGdMYZtWw",
  authDomain: "senatask-93a95.firebaseapp.com",
  projectId: "senatask-93a95",
  storageBucket: "senatask-93a95.firebasestorage.app",
  messagingSenderId: "60816551503",
  appId: "1:60816551503:web:185779b02ed4a2799c043a",
  measurementId: "G-288G6WQ98S"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
