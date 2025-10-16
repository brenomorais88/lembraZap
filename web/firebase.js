// web/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
// Se quiser Analytics depois, use também via CDN:
// import { getAnalytics }  from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcNAYKVQ84ndY83dT_cZQQiS4UwbOWqdc", // <- CONFIRA: letra O, não zero
  authDomain: "lembrazap-8d17d.firebaseapp.com",
  projectId: "lembrazap-8d17d",
  storageBucket: "lembrazap-8d17d.firebasestorage.app",
  messagingSenderId: "286871079465",
  appId: "1:286871079465:web:0a5ede56a12dc4832aea38",
  measurementId: "G-12JMW8P09W" // confirme no console; se não usar analytics, pode remover
};

console.log("FB CONFIG LOADED FROM firebase.js", firebaseConfig.apiKey);

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const analytics = getAnalytics(app); // opcional, só com HTTPS

// expõe p/ outros scripts
window.fbAuth  = auth;
window.__FBCFG__ = firebaseConfig;
