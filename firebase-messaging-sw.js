// firebase-messaging-sw.js
self.addEventListener('install', (event) => {
  console.log('SW instalado correctamente.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW activado correctamente.');
});
