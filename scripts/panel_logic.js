// scripts/panel_logic.js

// 1. Importaciones (ahora mucho más simples)
// Solo necesitamos 'auth' de init.js y las funciones de autenticación
import { auth } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// --- YA NO NECESITAMOS NADA DE FIREBASE MESSAGING O FIRESTORE AQUÍ ---
// import { getMessaging, getToken, onMessage } from "..."; // ELIMINADO
// import { doc, setDoc } from "..."; // ELIMINADO


// 2. Referencias al DOM (simplificadas)
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logoutBtn');
const contentWrapper = document.getElementById('content-wrapper');
const loginPrompt = document.getElementById('login-prompt');
// Renombramos el formulario para mayor claridad
const notificationForm = document.getElementById('notification-form'); 
const notificationText = document.getElementById('notification-text');
// El botón de suscribirse ya no es necesario, OneSignal lo maneja
// const subscribeBtn = document.getElementById('subscribeBtn'); // ELIMINADO


// 3. Lógica de autenticación (sin cambios, sigue protegiendo la página)
onAuthStateChanged(auth, user => {
    if (user) {
        contentWrapper.style.display = 'block';
        loginPrompt.style.display = 'none';
        userEmailSpan.textContent = `Conectado como: ${user.displayName || user.email}`;
    } else {
        contentWrapper.style.display = 'none';
        loginPrompt.style.display = 'block';
        userEmailSpan.textContent = '';
    }
});


// 4. Lógica para suscribirse a las notificaciones (ELIMINADA)
// OneSignal gestiona esto automáticamente a través del script en el <head> de panel.html.
// No necesitamos escribir ningún código para ello. ¡Más simple!


// 5. Lógica para ENVIAR una nueva notificación (adaptada para OneSignal)
if (notificationForm) {
    notificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = notificationText.value.trim(); // Usamos 'message' en lugar de 'body'
        if (!message) return;

        const button = notificationForm.querySelector('button');
        button.disabled = true;
        button.textContent = 'Enviando...';

        try {
            // Llamamos a nuestra nueva API que habla con OneSignal
            const response = await fetch('/api/send-notification', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ message: message }) // Enviamos 'message'
            });

            if (!response.ok) {
                // Si el servidor falla, intentamos leer el mensaje de error
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'El servidor devolvió un error.');
            }
            
            notificationText.value = '';
            alert('¡Notificación enviada con éxito!');

        } catch (error) {
            console.error("Error al enviar notificación:", error);
            alert(`No se pudo enviar la notificación. Revisa la consola.`);
        } finally {
            button.disabled = false;
            button.textContent = 'Enviar Notificación';
        }
    });
}


// 6. Lógica para recibir notificaciones en primer plano (ELIMINADA)
// OneSignal también puede gestionar esto, pero por ahora lo mantenemos simple.


// 7. Lógica del botón de cerrar sesión (sin cambios)
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => { 
        signOut(auth); 
    });
}