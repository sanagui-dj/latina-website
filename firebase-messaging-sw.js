// firebase-messaging-sw.js

// --- PASO 1: Importar los scripts de Firebase con la sintaxis correcta para Service Workers ---
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js');

// --- PASO 2: Configuración de Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyCNUJsHxibPMD501orEEb4s7GlOi5GtISY",
  authDomain: "latina-live-form.firebaseapp.com",
  projectId: "latina-live-form",
  storageBucket: "latina-live-form.appspot.com",
  messagingSenderId: "939678957600",
  appId: "1:939678957600:web:baa732db18a83b5f713c45",
  measurementId: "G-BJ538VWWG2" // <-- corregido
};

// --- PASO 3: Inicializar Firebase y Messaging ---
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// --- PASO 4: Escuchar por notificaciones en segundo plano ---
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/logo.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
