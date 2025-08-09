// firebase-messaging-sw.js

// --- PASO 1: Importar los scripts de Firebase con la sintaxis correcta para Service Workers ---
// NO usamos 'import', usamos 'importScripts'.
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js');

// --- PASO 2: Tu configuración de Firebase ---
// ¡IMPORTANTE! Pega aquí tu objeto firebaseConfig completo.
// Es seguro hacerlo en este archivo.
const firebaseConfig = {
  apiKey: "AIzaSyCNUJsHxibPMD501orEEb4s7GlOi5GtISY",
  authDomain: "latina-live-form.firebaseapp.com",
  projectId: "latina-live-form",
  storageBucket: "latina-live-form.appspot.com",
  messagingSenderId: "939678957600",
  appId: "1:939678957600:web:baa732db18a83b5f713c45",
  measurementId: ""G-BJ538VWWG2"
};


// --- PASO 3: Inicializar Firebase y Messaging ---
// Usamos los nombres de las funciones globales que se cargaron con importScripts.
const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging.getMessaging(app);


// --- PASO 4: Escuchar por notificaciones en segundo plano ---
// Esta función se activa cuando llega una notificación y el navegador está cerrado o en otra pestaña.
firebase.messaging.onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido:', payload);

  // Extraemos el título y el cuerpo del mensaje
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/logo.jpg' // Opcional: El icono que aparecerá en la notificación
  };

  // Le decimos al navegador que muestre la notificación
  self.registration.showNotification(notificationTitle, notificationOptions);
});