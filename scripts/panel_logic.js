// scripts/panel_logic.js

// 1. Importaciones (sin cambios)
import { auth, db } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// 2. Referencias al DOM (sin cambios)
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logoutBtn');
const contentWrapper = document.getElementById('content-wrapper');
const loginPrompt = document.getElementById('login-prompt');
const notificationForm = document.getElementById('new-notification-form');
const notificationText = document.getElementById('notification-text');
const subscribeBtn = document.getElementById('subscribeBtn');

// 3. Lógica de autenticación (sin cambios)
onAuthStateChanged(auth, user => {
    if (user) {
        contentWrapper.style.display = 'block';
        loginPrompt.style.display = 'none';
        userEmailSpan.textContent = `Conectado como: ${user.displayName || user.email}`;
        initializeMessaging();
    } else {
        contentWrapper.style.display = 'none';
        loginPrompt.style.display = 'block';
        userEmailSpan.textContent = '';
    }
});

// 4. Lógica para suscribirse a las notificaciones (VERSIÓN SIMPLIFICADA Y CORRECTA)
async function subscribeToNotifications() {
  const messaging = getMessaging();
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permiso de notificación concedido.');
      
      // Dejamos que Firebase encuentre el Service Worker por defecto.
      // Nuestro server.js ahora se lo entregará correctamente.
      const token = await getToken(messaging, {
        vapidKey: 'BHN3F0qmnSdC8p3HNu3cRrh3KErpeiLNoN07frb8mJUbNpGW1sRPkD1UiA08vdMvNwkFilMeFD2VkFLShzK57zw'
      });

      if (token) {
        console.log('Token de suscripción obtenido:', token);
        await setDoc(doc(db, "subscriptions", token), {
          uid: auth.currentUser.uid,
          timestamp: new Date()
        });
        alert('¡Te has suscrito a las notificaciones con éxito!');
        subscribeBtn.textContent = 'Suscrito ✅';
        subscribeBtn.disabled = true;
      }
    } else {
      console.log('Permiso denegado.');
    }
  } catch (error) {
    console.error('Error final en suscripción:', error);
    alert('No se pudo suscribir a las notificaciones. Revisa la consola.');
  }
}

// 5. Lógica para enviar notificaciones (sin cambios)
notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = notificationText.value.trim();
    if (!body) return;
    const button = notificationForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Enviando...';
    try {
        const response = await fetch('/api/send-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Aviso de Latina Live', body: body }) });
        if (!response.ok) throw new Error('El servidor devolvió un error.');
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        notificationText.value = '';
        alert(result.message || 'Notificación enviada.');
    } catch (error) {
        alert(`No se pudo enviar la notificación: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = 'Enviar Notificación';
    }
});

// 6. Lógica para recibir notificaciones (sin cambios)
function initializeMessaging() {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
        console.log('Mensaje recibido en primer plano: ', payload);
        alert(`Nuevo aviso:\n${payload.notification.title}\n${payload.notification.body}`);
    });
}

// 7. Lógica de botones (sin cambios)
logoutBtn.addEventListener('click', () => { signOut(auth); });
if (subscribeBtn) {
    subscribeBtn.addEventListener('click', subscribeToNotifications);
}