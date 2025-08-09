// scripts/panel_logic.js

// 1. Importar todo lo que necesitamos de Firebase y de nuestro init.js
import { auth } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// 2. Referencias a los elementos del DOM
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logoutBtn');
const contentWrapper = document.getElementById('content-wrapper');
const loginPrompt = document.getElementById('login-prompt');
const notificationForm = document.getElementById('new-notification-form');
const notificationText = document.getElementById('notification-text');
const subscribeBtn = document.getElementById('subscribeBtn');

// 3. El "Portero": onAuthStateChanged (lógica principal de la página)
onAuthStateChanged(auth, user => {
    if (user) {
        // --- Usuario AUTENTICADO ---
        contentWrapper.style.display = 'block';
        loginPrompt.style.display = 'none';
        userEmailSpan.textContent = `Conectado como: ${user.displayName || user.email}`;
        initializeMessaging(); // Inicializamos el sistema de mensajería
    } else {
        // --- Usuario NO AUTENTICADO ---
        contentWrapper.style.display = 'none';
        loginPrompt.style.display = 'block';
        userEmailSpan.textContent = '';
    }
});

// 4. Lógica para suscribirse a las notificaciones (VERSIÓN SIMPLIFICADA)
async function subscribeToNotifications() {
  const messaging = getMessaging();
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permiso de notificación concedido.');
      
      // DEJAMOS QUE FIREBASE HAGA SU MAGIA.
      // Él buscará automáticamente /firebase-messaging-sw.js en la raíz del sitio.
      const token = await getToken(messaging, {
        vapidKey: 'BHN3F0qmnSdC8p3HNu3cRrh3KErpeiLNoN07frb8mJUbNpGW1sRPkD1UiA08vdMvNwkFilMeFD2VkFLShzK57zw'
      });

      if (token) {
        console.log('Token de suscripción obtenido:', token);
        const db = getFirestore();
        await setDoc(doc(db, "subscriptions", token), {
          uid: auth.currentUser.uid,
          timestamp: new Date()
        });
        alert('¡Te has suscrito a las notificaciones con éxito!');
        subscribeBtn.textContent = 'Suscrito ✅';
        subscribeBtn.disabled = true;
      } else {
        console.warn('No se pudo obtener el token de suscripción. Asegúrate de que el archivo firebase-messaging-sw.js es accesible en la raíz del sitio.');
        alert('No se pudo completar la suscripción.');
      }
    } else {
      console.log('El usuario no concedió permiso para recibir notificaciones.');
      alert('Has denegado el permiso para recibir notificaciones.');
    }
  } catch (error) {
    // Este es el error que estabas viendo. Ahora debería darnos más pistas si algo sigue mal.
    console.error('Error durante el proceso de suscripción:', error);
    alert('Ocurrió un error al intentar suscribirse. Revisa la consola para más detalles.');
  }
}

// 5. Lógica para ENVIAR una nueva notificación (sin cambios)
notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = notificationText.value.trim();
    if (!body) return;

    const button = notificationForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Enviando...';

    try {
        const response = await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Aviso de Latina Live', body: body })
        });
        if (!response.ok) throw new Error('El servidor devolvió un error.');
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        
        notificationText.value = '';
        alert(result.message || 'Notificación enviada.');
    } catch (error) {
        console.error("Error al enviar notificación:", error);
        alert(`No se pudo enviar la notificación: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = 'Enviar Notificación';
    }
});

// 6. Lógica para RECIBIR notificaciones MIENTRAS LA PÁGINA ESTÁ ABIERTA (sin cambios)
function initializeMessaging() {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
        console.log('Mensaje recibido en primer plano: ', payload);
        alert(`Nuevo aviso:\n${payload.notification.title}\n${payload.notification.body}`);
    });
}

// 7. Lógica del botón de cerrar sesión (sin cambios)
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// 8. Lógica del botón de suscribirse
// Nos aseguramos de que el botón exista antes de añadir el evento
if (subscribeBtn) {
    subscribeBtn.addEventListener('click', subscribeToNotifications);
}