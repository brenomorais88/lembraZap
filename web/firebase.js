// web/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcNAYKVQ84ndY83dT_cZQQiS4UwbOWqdc",
  authDomain: "lembrazap-8d17d.firebaseapp.com",
  projectId: "lembrazap-8d17d",
  storageBucket: "lembrazap-8d17d.firebasestorage.app",
  messagingSenderId: "286871079465",
  appId: "1:286871079465:web:0a5ede56a12dc4832aea38",
  measurementId: "G-12JMW8P09W"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

window.fbAuth = auth;
window.db = db;
// helpers Firestore
window.dbSet = setDoc;
window.dbDoc = doc;
window.dbNow = serverTimestamp;
