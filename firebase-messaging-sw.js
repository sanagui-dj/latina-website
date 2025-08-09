// firebase-messaging-sw.js (Firebase v12 modular)

// Importar solo lo necesario
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-sw.js';

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
const app = initializeApp(firebaseConfig);

// Inicializar Messaging en el SW
const messaging = getMessaging(app);

// Escuchar mensajes en segundo plano
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/img/logo.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
