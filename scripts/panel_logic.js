// scripts/panel_logic.js
import { auth, db } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logoutBtn');
const contentWrapper = document.getElementById('content-wrapper');
const loginPrompt = document.getElementById('login-prompt');
const notificationForm = document.getElementById('notification-form');
const notificationText = document.getElementById('notification-text');
const submitBtn = document.getElementById('notification-form')?.querySelector('button');

onAuthStateChanged(auth, user => {
  if (user) {
    if (contentWrapper) contentWrapper.style.display = 'block';
    if (loginPrompt) loginPrompt.style.display = 'none';
    if (userEmailSpan) userEmailSpan.textContent = `Locutor: ${user.email}`;
  } else {
    if (contentWrapper) contentWrapper.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = 'block';
  }
});

if (notificationForm) {
  notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = notificationText.value.trim();
    if (!message) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Publicando...';

    try {
      await addDoc(collection(db, "avisos_vivos"), {
        mensaje: message,
        autor: auth.currentUser.email,
        fecha: serverTimestamp()
      });
      notificationText.value = '';
      // Status message handled by form button for now, but adding console for debugging
      console.log("Aviso publicado exitosamente");
    } catch (error) {
      console.error("Error al publicar aviso:", error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publicar Aviso';
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => signOut(auth));
}