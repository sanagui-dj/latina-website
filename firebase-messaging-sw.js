// firebase-messaging-sw.js

// Importamos los scripts de Firebase (esto es necesario)
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js");

// TODO: Pega aquí tu firebaseConfig COMPLETO (el mismo de init.js)
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
const auth = getAuth(app);

export { auth };// Inicializamos la app de Firebase en el service worker
initializeApp(firebaseConfig);
const messaging = getMessaging();

// Este escuchador se activa cuando llega una notificación y la web está en segundo plano
onBackgroundMessage(messaging, (payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/logo.jpg' // Opcional: un icono para la notificación
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});