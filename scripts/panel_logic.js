// scripts/panel_logic.js

// 1. Importamos ahora también 'db' desde nuestro archivo central 'init.js'
import { auth, db } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// El resto de tu código estaba perfecto, lo único que cambia es que ya no necesitamos
// llamar a getFirestore() aquí, porque ya lo tenemos importado.

const userEmailSpan = document.getElementById('user-email');
// ... (el resto de las referencias al DOM son iguales) ...
const subscribeBtn = document.getElementById('subscribeBtn');

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

async function subscribeToNotifications() {
  const messaging = getMessaging();
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permiso de notificación concedido.');
      const token = await getToken(messaging, {
        vapidKey: 'BHN3F0qmnSdC8p3HNu3cRrh3KErpeiLNoN07frb8mJUbNpGW1sRPkD1UiA08vdMvNwkFilMeFD2VkFLShzK57zw'
      });

      if (token) {
        console.log('Token de suscripción obtenido:', token);
        // Usamos la 'db' que importamos de init.js
        await setDoc(doc(db, "subscriptions", token), {
          uid: auth.currentUser.uid,
          timestamp: new Date()
        });
        alert('¡Te has suscrito a las notificaciones con éxito!');
        subscribeBtn.textContent = 'Suscrito ✅';
        subscribeBtn.disabled = true;
      } else {
        console.warn('No se pudo obtener el token.');
        alert('No se pudo completar la suscripción.');
      }
    } else {
      console.log('Permiso denegado.');
      alert('Has denegado el permiso para recibir notificaciones.');
    }
  } catch (error) {
    console.error('Error durante el proceso de suscripción:', error);
    alert('Ocurrió un error al intentar suscribirse. Revisa la consola para más detalles.');
  }
}

// ... El resto de tus funciones (notificationForm.addEventListener, etc.) se quedan exactamente igual ...
// ... Ellas no necesitan ser modificadas.

// --- Asegúrate de que las siguientes funciones y listeners estén al final ---
function initializeMessaging() { /* ... igual que antes ... */ }
notificationForm.addEventListener('submit', async (e) => { /* ... igual que antes ... */ });
logoutBtn.addEventListener('click', () => { /* ... igual que antes ... */ });
if (subscribeBtn) {
    subscribeBtn.addEventListener('click', subscribeToNotifications);
}