// scripts/init.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Tu config está perfecta, no se toca
const firebaseConfig = {
  apiKey: "AIzaSyCNUJsHxibPMD501orEEb4s7GlOi5GtISY",
  authDomain: "latina-live-form.firebaseapp.com",
  projectId: "latina-live-form",
  storageBucket: "latina-live-form.appspot.com",
  messagingSenderId: "939678957600",
  appId: "1:939678957600:web:baa732db18a83b5f713c45",
  measurementId: "G-BJ538VWWG2"
};

const app = initializeApp(firebaseConfig);

// Exportamos todos los servicios que nuestra app necesita
export const auth = getAuth(app);
export const db = getFirestore(app);