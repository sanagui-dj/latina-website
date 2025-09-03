// scripts/panel_logic.js

// ==============================
// 1. Importaciones
// ==============================
import { auth } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ==============================
// 2. Inicialización de OneSignal (SDK v16)
// ==============================
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.init({
    appId: "2b78d632-69cd-45e8-bda3-4208f4bf59d0",
    safari_web_id: "web.onesignal.auto.5ffbfb2e-5b9e-4e33-a6e5-d97b1e693743",
    notifyButton: { enable: true },
    allowLocalhostAsSecureOrigin: true
  });

  const isSupported = await OneSignal.Notifications.isPushSupported();
  console.log("OneSignal: isPushSupported =", isSupported);
  if (!isSupported) return;

  const permission = await OneSignal.Notifications.permission;
  console.log("OneSignal: permission =", permission);

  if (permission !== "granted") {
    try { await OneSignal.Slidedown.promptPush(); } catch (e) { console.warn("promptPush:", e); }
  }

  try { await OneSignal.User.Push.subscribe(); } catch (e) { console.error("Push.subscribe:", e); }
  const subscriptionId = await OneSignal.User.Push.getSubscriptionId();
  console.log("OneSignal: subscriptionId =", subscriptionId);
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

function showLoggedUI(emailOrName) {
  if (contentWrapper) contentWrapper.style.display = 'block';
  if (loginPrompt) loginPrompt.style.display = 'none';
  if (userEmailSpan) userEmailSpan.textContent = `Conectado como: ${emailOrName}`;
}
function showLoggedOutUI() {
  if (contentWrapper) contentWrapper.style.display = 'none';
  if (loginPrompt) loginPrompt.style.display = 'block';
  if (userEmailSpan) userEmailSpan.textContent = '';
}

// ==============================
// 4. Lógica de autenticación + identidad OneSignal
// ==============================
onAuthStateChanged(auth, user => {
  if (user) {
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        await OneSignal.User.Push.subscribe();
        await OneSignal.login(user.uid); // external_id = UID de Firebase
        console.log("OneSignal: external_id (login) =", user.uid);

        // (Opcional) mantenemos tag si lo quieres
        await OneSignal.User.addTags({ locutor_uid: user.uid });
      } catch (err) {
        console.error("OneSignal (login/addTags) error:", err);
      }
    });

    showLoggedUI(user.displayName || user.email || 'Usuario');
  } else {
    showLoggedOutUI();
  }
});

// ==============================
// 5. Envío de notificación
// ==============================
if (notificationForm) {
  notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = (notificationText?.value || '').trim();
    if (!message) {
      alert("Escribe un mensaje antes de enviar.");
      return;
    }

    const button = notificationForm.querySelector('button');
    if (button) {
      button.disabled = true;
      button.textContent = 'Enviando...';
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("No hay usuario autenticado.");
        return;
      }
      const locutorId = user.uid;

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, locutorId })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Error en el servidor.');

      console.log("OneSignal (server response):", result);

      // Tomar recipients de la respuesta real:
      const recipients =
        (result?.oneSignalResponse && typeof result.oneSignalResponse.recipients === 'number')
          ? result.oneSignalResponse.recipients
          : (typeof result?.recipients === 'number' ? result.recipients : 0);

      if (notificationText) notificationText.value = '';
      alert(`¡Notificación enviada! Destinatarios: ${recipients}`);
    } catch (error) {
      console.error("Error al enviar notificación:", error);
      alert("No se pudo enviar la notificación. Revisa la consola para más detalles.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Enviar Notificación a Todos';
      }
    }
  });
}

// ==============================
// 6. Cerrar sesión
// ==============================
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    signOut(auth).catch(err => console.error('Error al cerrar sesión:', err));
  });
}
