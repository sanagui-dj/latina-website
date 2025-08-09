// scripts/panel_logic.js

// 1. Importar todo lo que necesitamos de Firebase y de nuestro init.js
import { auth } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// 2. Inicializar Firestore
const db = getFirestore();

// 3. Referencias a los elementos del DOM
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logoutBtn');
const contentWrapper = document.getElementById('content-wrapper');
const loginPrompt = document.getElementById('login-prompt');
const notificationForm = document.getElementById('new-notification-form');
const notificationText = document.getElementById('notification-text');
const notificationsList = document.getElementById('notifications-list');

// 4. El "Portero": onAuthStateChanged
onAuthStateChanged(auth, user => {
    if (user) {
        // --- Usuario AUTENTICADO ---
        contentWrapper.style.display = 'block';
        loginPrompt.style.display = 'none';
        userEmailSpan.textContent = `Conectado como: ${user.displayName || user.email}`;

        // Escuchar por notificaciones en TIEMPO REAL
        listenForNotifications();

    } else {
        // --- Usuario NO AUTENTICADO ---
        contentWrapper.style.display = 'none';
        loginPrompt.style.display = 'block';
        userEmailSpan.textContent = '';
    }
});

// 5. Función para escuchar y mostrar notificaciones
function listenForNotifications() {
    const notificationsRef = collection(db, 'notificaciones');
    // Creamos una consulta para ordenar por fecha, la más nueva primero
    const q = query(notificationsRef, orderBy('timestamp', 'desc'));

    // onSnapshot es la magia: se ejecuta cada vez que hay un cambio en la base de datos
    onSnapshot(q, (snapshot) => {
        notificationsList.innerHTML = ''; // Limpiamos la lista
        if (snapshot.empty) {
            notificationsList.innerHTML = '<p>No hay notificaciones.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const notification = doc.data();
            const date = notification.timestamp ? notification.timestamp.toDate().toLocaleString() : 'Enviando...';
            
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `
                <p>${notification.text}</p>
                <div class="notification-meta">
                    <strong>Por:</strong> ${notification.author} | <strong>Fecha:</strong> ${date}
                </div>
            `;
            notificationsList.appendChild(item);
        });
    });
}

// 6. Función para ENVIAR una nueva notificación
notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = notificationText.value.trim();
    const user = auth.currentUser;

    if (text && user) {
        try {
            // Añadimos un nuevo documento a la colección 'notificaciones'
            await addDoc(collection(db, 'notificaciones'), {
                text: text,
                author: user.displayName || user.email,
                timestamp: serverTimestamp() // Firebase pone la fecha y hora del servidor
            });
            notificationText.value = ''; // Limpiamos el campo
        } catch (error) {
            console.error("Error al enviar notificación: ", error);
            alert("No se pudo enviar la notificación.");
        }
    }
});

// 7. Lógica del botón de cerrar sesión
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});