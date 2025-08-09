importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js');

// ¡IMPORTANTE! Pega aquí tu objeto firebaseConfig completo.
const firebaseConfig = {
  apiKey: "AIzaSyCNUJsHxibPMD501orEEb4s7GlOi5GtISY",
  authDomain: "latina-live-form.firebaseapp.com",
  projectId: "latina-live-form",
  storageBucket: "latina-live-form.appspot.com",
  messagingSenderId: "939678957600",
  appId: "1:939678957600:web:baa732db18a83b5f713c45",
  measurementId: "G-BJ538VWWG2"
};

const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Escuchar mensajes en segundo plano
firebase.messaging.onBackgroundMessage(messaging, (payload) => {
  console.log('[SW] Mensaje en segundo plano recibido:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/logo.jpg'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
