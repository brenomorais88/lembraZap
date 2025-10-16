// web/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// ⚙️ Config do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDcNAYKVQ84ndY83dT_cZQQiS4Uwb0Wqdc",
  authDomain: "lembrazap-8d17d.firebaseapp.com",
  projectId: "lembrazap-8d17d",
  storageBucket: "lembrazap-8d17d.appspot.com",
  messagingSenderId: "286871079465",
  appId: "1:286871079465:web:0a5ede56a12dc4832aea38",
  measurementId: "G-12JMW8P09W",
};

// 🔥 Inicializa e expõe globalmente
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// deixa acessível para outros scripts
window.fbAuth = auth;

// opcional: pequena flag pra sabermos que carregou
window.fbReady = true;
