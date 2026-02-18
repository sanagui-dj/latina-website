export async function initChat() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;

    const chatForm = document.querySelector('.chat-controls');

    if (chatForm) {
        chatForm.onsubmit = function (e) {
            e.preventDefault();
            enviarMensaje();
        };
    }

    // Limpiar intervalo previo para evitar que el chat se cargue doble
    if (window.chatInterval) clearInterval(window.chatInterval);

    cargarChat();
    window.chatInterval = setInterval(cargarChat, 4000); // Carga cada 4 segundos
}

async function enviarMensaje() {
    const usuarioInput = document.getElementById('chat-nombre');
    const mensajeInput = document.getElementById('chat-msg');
    const submitBtn = document.querySelector('.btn-chat-send');

    const usuario = usuarioInput.value || "Invitado";
    const mensaje = mensajeInput.value;

    if (!mensaje || !mensaje.trim()) return;

    // Feedback visual para el usuario
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
    }

    try {
        // CORRECCIÓN: Usamos la ruta correcta del servidor (/api/pedido)
        const response = await fetch('/api/pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                nombre: usuario, 
                mensaje: mensaje,
                cancion: "Mensaje de Chat" // Etiqueta para Telegram
            })
        });

        // Como el servidor responde con una redirección (302), 
        // el 'response.ok' será verdadero si llega a la página final
        if (response.ok) {
            mensajeInput.value = '';
            await cargarChat();
        } else {
            alert("No se pudo enviar el mensaje al chat.");
        }
    } catch (e) {
        console.error("Error al enviar mensaje", e);
        alert(`Error de conexión: ${e.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Enviar a Latina Live";
        }
        mensajeInput.focus();
    }
}

let lastMessageCount = 0;

async function cargarChat() {
    try {
        const box = document.getElementById('mensajes-box');
        if (!box) return;

        // Consultamos la ruta de lectura del servidor
        const res = await fetch('/api/leer-chat');
        const mensajes = await res.json(); 

        if (mensajes.length > lastMessageCount && lastMessageCount !== 0) {
            // Aquí podrías poner un sonido de "Pop" si quisieras
        }
        lastMessageCount = mensajes.length;

        box.innerHTML = mensajes.map(m => {
            // El servidor ya envía 'fecha' formateada como "10:30 PM"
            const timeStr = m.fecha || ''; 
            const timestampHTML = timeStr ? `<small style="color: var(--brand-primary); margin-right: 0.5rem;">[${timeStr}]</small>` : '';

            return `
            <p style="margin-bottom: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                ${timestampHTML} 
                <strong>${m.usuario}:</strong> 
                <span style="color: var(--text-main);">${m.mensaje}</span>
            </p>
            `;
        }).join('');

        // Auto-scroll al final para ver los mensajes nuevos
        box.scrollTop = box.scrollHeight;
    } catch (e) {
        console.error("Error cargando el chat", e);
    }
}