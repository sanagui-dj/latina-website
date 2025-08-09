// firebase-messaging-sw.js

// 1. Importar los scripts de Firebase
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js');

// 2. Tu configuración de Firebase (está perfecta, no la toques)
const firebaseConfig = {
  apiKey: "AIzaSyCNUJsHxibPMD501orEEb4s7GlOi5GtISY",
  authDomain: "latina-live-form.firebaseapp.com",
  projectId: "latina-live-form",
  storageBucket: "latina-live-form.appspot.com",
  messagingSenderId: "939678957600",
  appId: "1:939678957600:web:baa732db18a83b5f713c45",
  measurementId: "G-BJ538VWWG2"
};

// 3. Inicializar Firebase y Messaging (LA CORRECCIÓN ESTÁ AQUÍ)
const app = firebase.initializeApp(firebaseConfig);

// Usamos getMessaging(app) igual que en el cliente, pero a través del objeto global 'firebase.messaging'
const messaging = firebase.messaging.getMessaging(app);

// 4. Escuchar por notificaciones en segundo plano
firebase.messaging.onBackgroundMessage(messaging, (payload) => {
  console.log('[SW] Mensaje en segundo plano recibido:', payload);
  
  // Verificamos que la notificación tiene un título
  if (!payload.notification?.title) {
    console.warn('[SW] Notificación recibida sin título, no se mostrará.');
    return;
  }

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/logo.jpg'
  };

  // self.registration.showNotification es la forma correcta de mostrarla
  self.registration.showNotification(notificationTitle, notificationOptions);
});