// scripts/panel_logic.js

// 1. Importar todo lo que necesitamos de Firebase y de nuestro init.js
import { auth } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
// --- NUEVOS IMPORTS para Notificaciones Push ---
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// 2. Referencias a los elementos del DOM (algunas nuevas)
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logoutBtn');
const contentWrapper = document.getElementById('content-wrapper');
const loginPrompt = document.getElementById('login-prompt');
const notificationForm = document.getElementById('new-notification-form');
const notificationText = document.getElementById('notification-text');
const subscribeBtn = document.getElementById('subscribeBtn'); // <-- NUEVO: Botón para suscribirse

// 3. El "Portero": onAuthStateChanged (lógica principal de la página)
onAuthStateChanged(auth, user => {
    if (user) {
        // --- Usuario AUTENTICADO ---
        contentWrapper.style.display = 'block';
        loginPrompt.style.display = 'none';
        userEmailSpan.textContent = `Conectado como: ${user.displayName || user.email}`;
        
        // Inicializamos el sistema de mensajería una vez que el usuario está logueado
        initializeMessaging();

    } else {
        // --- Usuario NO AUTENTICADO ---
        contentWrapper.style.display = 'none';
        loginPrompt.style.display = 'block';
        userEmailSpan.textContent = '';
    }
});

// 4. Lógica para suscribirse a las notificaciones
async function subscribeToNotifications() {
  const messaging = getMessaging();
  try {
    // Pedimos permiso al usuario (el navegador mostrará una ventana emergente)
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permiso de notificación concedido.');
      
      // Obtenemos el "token" (la dirección postal) de este navegador
      const token = await getToken(messaging, {
        // ¡IMPORTANTE! Pega aquí la clave pública que generaste en la consola de Firebase
        vapidKey: 'BHN3F0qmnSdC8p3HNu3cRrh3KErpeiLNoN07frb8mJUbNpGW1sRPkD1UiA08vdMvNwkFilMeFD2VkFLShzK57zw'
      });

      if (token) {
        console.log('Token de suscripción obtenido:', token);
        // Guardamos este token en nuestra base de datos para poder enviarle mensajes
        const db = getFirestore();
        await setDoc(doc(db, "subscriptions", token), {
          uid: auth.currentUser.uid,
          timestamp: new Date()
        });
        alert('¡Te has suscrito a las notificaciones con éxito!');
        subscribeBtn.textContent = 'Suscrito ✅';
        subscribeBtn.disabled = true;
      } else {
        console.warn('No se pudo obtener el token de suscripción.');
        alert('No se pudo completar la suscripción. Asegúrate de no estar en modo incógnito y de que tu navegador es compatible.');
      }
    } else {
      console.log('El usuario no concedió permiso para recibir notificaciones.');
      alert('Has denegado el permiso para recibir notificaciones.');
    }
  } catch (error) {
    console.error('Error durante el proceso de suscripción:', error);
    alert('Ocurrió un error al intentar suscribirse.');
  }
}

// 5. Lógica para ENVIAR una nueva notificación a todos
notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = notificationText.value.trim();
    if (!body) return;

    const button = notificationForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Enviando...';

    try {
        // Llamamos a nuestra nueva API en el backend (server.js)
        const response = await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Aviso de Latina Live', body: body }) // Enviamos un título y el mensaje
        });

        if (!response.ok) throw new Error('El servidor devolvió un error.');

        const result = await response.json();
        if (result.error) throw new Error(result.error);
        
        notificationText.value = ''; // Limpiamos el campo
        alert(result.message || 'Notificación enviada.');

    } catch (error) {
        console.error("Error al enviar notificación:", error);
        alert(`No se pudo enviar la notificación: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = 'Enviar Notificación';
    }
});

// 6. Lógica para RECIBIR notificaciones MIENTRAS LA PÁGINA ESTÁ ABIERTA
function initializeMessaging() {
    const messaging = getMessaging();
    // Este escuchador se activa si llega una notificación y el usuario tiene la pestaña abierta
    onMessage(messaging, (payload) => {
        console.log('Mensaje recibido en primer plano: ', payload);
        // Mostramos una alerta simple, pero podría ser una notificación más elegante
        alert(`Nuevo aviso:\n${payload.notification.title}\n${payload.notification.body}`);
    });
}

// 7. Lógica del botón de cerrar sesión (sin cambios)
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// 8. Lógica del botón de suscribirse (sin cambios)
subscribeBtn.addEventListener('click', subscribeToNotifications);