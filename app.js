    // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNkOS9iIm_TTTKSZHfhIcSw94fZUELyRQ",
  authDomain: "don-bosco-theatre-7f7ac.firebaseapp.com",
  projectId: "don-bosco-theatre-7f7ac",
  storageBucket: "don-bosco-theatre-7f7ac.firebasestorage.app",
  messagingSenderId: "980744605039",
  appId: "1:980744605039:web:04f17958f87386f0012c9a",
  measurementId: "G-1LJFSKEQBV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
