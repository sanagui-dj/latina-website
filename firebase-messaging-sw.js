// firebase-messaging-sw.js

// Importar scripts de Firebase (compat)
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCNUJsHxibPMD501orEEb4s7GlOi5GtISY",
  authDomain: "latina-live-form.firebaseapp.com",
  projectId: "latina-live-form",
  storageBucket: "latina-live-form.appspot.com",
  messagingSenderId: "939678957600",
  appId: "1:939678957600:web:baa732db18a83b5f713c45",
  measurementId: "G-BJ538VWWG2"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Messaging
const messaging = firebase.messaging();

// Escuchar mensajes en segundo plano
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/logo.jpg'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
