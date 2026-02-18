export async function initChat() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return; // Exit if chat is not present on this page

    const chatForm = document.querySelector('.chat-controls');

    if (chatForm) {
        // Use addEventListener instead of onsubmit property for better compatibility
        chatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            enviarMensaje();
        });
    }

    // Start polling if not already started (check window.chatInterval logic if needed)
    // Clear existing to avoid duplicates if initChat is called multiple times
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

    if (!mensaje.trim()) return;

    // Visual Feedback: Disable button and show loading logic
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
    }

    try {
        const response = await fetch('https://latinalive.net/api/enviar-web', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, mensaje })
        });

        if (response.ok) {
            mensajeInput.value = '';
            // Refresh chat immediately
            await cargarChat();
        } else {
            console.error("Server responded with error:", response.status);
            alert("Hubo un problema al enviar el mensaje. Intenta de nuevo.");
        }
    } catch (e) {
        console.error("Error sending message", e);
        alert("Error de conexión. Verifica tu internet.");
    } finally {
        // Restore button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Enviar a Latina Live";
        }
        // Keep focus on input for better UX
        mensajeInput.focus();
    }
}

let lastMessageCount = 0;

async function cargarChat() {
    try {
        const box = document.getElementById('mensajes-box');
        if (!box) return;

        const res = await fetch('https://latinalive.net/api/leer-chat');
        const data = await res.json();
        const mensajes = Array.isArray(data) ? data : (data.mensajes || []);

        // Highlight New Messages if count increased
        if (mensajes.length > lastMessageCount && lastMessageCount !== 0) {
            // Visual cue logic
        }
        lastMessageCount = mensajes.length;

        box.innerHTML = mensajes.map(m => {
            let timeStr = '';
            if (m.fecha) {
                const date = new Date(m.fecha);
                if (!isNaN(date.getTime())) {
                    timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                }
            }
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
        console.error("Error loading chat", e);
    }
}
