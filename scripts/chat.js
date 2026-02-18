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

    if (window.chatInterval) clearInterval(window.chatInterval);

    cargarChat();
    window.chatInterval = setInterval(cargarChat, 4000); 
}

async function enviarMensaje() {
    const usuarioInput = document.getElementById('chat-nombre');
    const mensajeInput = document.getElementById('chat-msg');
    const submitBtn = document.querySelector('.btn-chat-send');

    const usuario = usuarioInput.value || "Invitado";
    const mensaje = mensajeInput.value;

    if (!mensaje || !mensaje.trim()) return;

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
    }

    try {
        // ACTUALIZACIÓN: Usamos la ruta dedicada al chat que creamos en el servidor
        const response = await fetch('/api/enviar-web', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuario: usuario, // Cambiado de 'nombre' a 'usuario' para coincidir con el servidor
                mensaje: mensaje
            })
        });

        // El servidor ahora responde con res.json({ status: 'ok' })
        if (response.ok) {
            mensajeInput.value = '';
            await cargarChat();
        } else {
            alert("No se pudo enviar el mensaje al chat.");
        }
    } catch (e) {
        console.error("Error al enviar mensaje", e);
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

        const res = await fetch('/api/leer-chat');
        const mensajes = await res.json(); 

        lastMessageCount = mensajes.length;

        box.innerHTML = mensajes.map(m => {
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

        box.scrollTop = box.scrollHeight;
    } catch (e) {
        console.error("Error cargando el chat", e);
    }
}