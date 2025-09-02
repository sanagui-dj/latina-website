// scripts/panel_logic.js

// ==============================
// 1. Importaciones
// ==============================
import { auth } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ==============================
// 2. Inicialización de OneSignal (SDK v16)
// ==============================
// IMPORTANTE: no pisar la cola existente
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.init({
    appId: "2b78d632-69cd-45e8-bda3-4208f4bf59d0",
    safari_web_id: "web.onesignal.auto.5ffbfb2e-5b9e-4e33-a6e5-d97b1e693743",
    notifyButton: { enable: true },
    allowLocalhostAsSecureOrigin: true
  });

  // Chequear soporte y permiso
  const isSupported = await OneSignal.Notifications.isPushSupported();
  console.log("OneSignal: isPushSupported =", isSupported);
  if (!isSupported) return;

  const permission = await OneSignal.Notifications.permission; // "default" | "granted" | "denied"
  console.log("OneSignal: permission =", permission);

  // Mostrar prompt si aún no está concedido
  if (permission !== "granted") {
    try { await OneSignal.Slidedown.promptPush(); } catch (e) { console.warn("promptPush:", e); }
  }

  // Asegurar suscripción (idempotente)
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

// Helpers UI
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
    // Tras login de Firebase, identificamos al usuario en OneSignal (external_id)
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        // Aseguramos suscripción (por si el init aún no lo hizo)
        await OneSignal.User.Push.subscribe();

        // *** IDENTIDAD RECOMENDADA v16 ***
        // external_id = UID de Firebase -> enviado desde el servidor
        await OneSignal.login(user.uid);
        console.log("OneSignal: external_id (login) =", user.uid);

        // (Opcional) Tags adicionales si quieres segmentar por más criterios
        await OneSignal.User.addTags({ locutor_uid: user.uid });
        const tags = await OneSignal.User.getTags().catch(() => ({}));
        console.log("OneSignal: tags =", tags);
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
      const locutorId = user.uid; // usamos el mismo UID

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, locutorId })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Error en el servidor.');

      console.log("OneSignal (server response):", result);
      if (notificationText) notificationText.value = '';
      const recipients = result?.oneSignalResponse?.recipients ?? 'desconocido';
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
