// scripts/panel_logic.js

// ==============================
// 1. Importaciones
// ==============================
import { auth } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ==============================
// 2. Inicialización de OneSignal
// ==============================
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
        appId: "2b78d632-69cd-45e8-bda3-4208f4bf59d0",
        safari_web_id: "web.onesignal.auto.5ffbfb2e-5b9e-4e33-a6e5-d97b1e693743",
        notifyButton: { enable: true }
    });
});

// ==============================
// 3. Referencias al DOM
// ==============================
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logoutBtn');
const contentWrapper = document.getElementById('content-wrapper');
const loginPrompt = document.getElementById('login-prompt');
const notificationForm = document.getElementById('notification-form');
const notificationText = document.getElementById('notification-text');

// ==============================
// 4. Lógica de autenticación
// ==============================
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

// ==============================
// 5. Envío de notificación
// ==============================
if (notificationForm) {
    notificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = notificationText.value.trim();
        if (!message) return;

        const button = notificationForm.querySelector('button');
        button.disabled = true;
        button.textContent = 'Enviando...';

        try {
            // Llamada a tu endpoint backend
            const response = await fetch('/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error en el servidor.');

            notificationText.value = '';
            alert('¡Notificación enviada con éxito!');

        } catch (error) {
            console.error("Error al enviar notificación:", error);
            alert(`No se pudo enviar la notificación. Ver consola.`);
        } finally {
            button.disabled = false;
            button.textContent = 'Enviar Notificación a Todos';
        }
    });
}

// ==============================
// 6. Cerrar sesión
// ==============================
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth);
    });
}
