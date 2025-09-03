// scripts/panel_logic.js

// ==============================
// 1. Importaciones
// ==============================
import { auth } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ==============================
// 0. Utilidades
// ==============================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitForSubscriptionId(OneSignal, attempts = 5, delayMs = 400) {
  for (let i = 0; i < attempts; i++) {
    const id = OneSignal?.User?.PushSubscription?.id || null;
    if (id) return id;
    await sleep(delayMs);
  }
  return OneSignal?.User?.PushSubscription?.id || null;
}

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

  // Soporte push
  const isSupported = await OneSignal.Notifications.isPushSupported();
  console.log("OneSignal: isPushSupported =", isSupported);
  if (!isSupported) return;

  // Listener de cambios en la suscripción (para depurar asignación de ID)
  OneSignal.User.PushSubscription.addEventListener("change", (ev) => {
    console.log("PushSubscription change:", { prev: ev.previous, curr: ev.current });
  });

  // Permiso actual (booleano en v16)
  const permission = await OneSignal.Notifications.permission;
  console.log("OneSignal: permission =", permission);

  // Si no hay permiso, mostrar prompt (forzado para tests)
  if (!permission) {
    try {
      await OneSignal.Slidedown.promptPush({ force: true });
    } catch (e) {
      console.warn("promptPush:", e);
    }
  }

  // Intentar asegurar suscripción (idempotente; chequeamos existencia)
  try {
    if (OneSignal?.User?.PushSubscription?.optIn) {
      await OneSignal.User.PushSubscription.optIn();
    }
  } catch (e) {
    console.error("PushSubscription.optIn:", e);
  }

  // Esperar a que haya ID de suscripción unos ciclos
  const subId = await waitForSubscriptionId(OneSignal, 6, 350);
  console.log("OneSignal: subscriptionId =", subId);
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

// Ajusta si tu backend NO está en el mismo dominio:
const API_BASE = ''; // p.ej. 'https://api.tu-dominio.com'

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
// 4. Autenticación + OneSignal.login con/sin token
// ==============================
onAuthStateChanged(auth, user => {
  if (user) {
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        // Asegurar suscripción por si acaso
        try {
          if (OneSignal?.User?.PushSubscription?.optIn) {
            await OneSignal.User.PushSubscription.optIn();
          }
        } catch {}

        // Pedir token al backend. Si no hay clave en el server, este endpoint
        // debería devolver 200 con { identityToken: null } (como ya dejamos en server opcional).
        let identityToken = null;
        try {
          const resp = await fetch(`${API_BASE}/api/onesignal/identity-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ externalId: user.uid })
          });
          const tok = await resp.json();
          if (!resp.ok) throw new Error(tok?.error || 'No se pudo obtener identityToken del servidor');
          identityToken = tok?.identityToken || null;
        } catch (e) {
          // Si falla este endpoint, no bloqueamos el login sin token
          console.warn("identity-token endpoint warning:", e?.message || e);
        }

        // Login con o sin token (tolerante a la configuración del panel)
        if (identityToken) {
          await OneSignal.login(user.uid, identityToken);
          console.log("OneSignal: login con token OK:", user.uid);
        } else {
          await OneSignal.login(user.uid);
          console.log("OneSignal: login sin token OK:", user.uid);
        }

        // (Opcional) Tags si también quieres segmentar por tag
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

      const response = await fetch(`${API_BASE}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, locutorId: user.uid })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Error en el servidor.');

      console.log("OneSignal (server response):", result);
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
