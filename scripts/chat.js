export async function initChat() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;

    const chatForm = document.querySelector('.chat-controls');

    if (chatForm) {
        // Remove old listener if any by cloning or just adding new one (event delegation is safer but this works for SPA if we re-run)
        // To avoid duplicate listeners on re-init, we can check a flag or just use the onsubmit property which is singular.
        chatForm.onsubmit = function (e) {
            e.preventDefault();
            enviarMensaje();
        };
    }

    // Clear existing interval to avoid duplicates
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

    // Visual Feedback
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
    }

    try {
        // Use relative URL
        const response = await fetch('/api/enviar-web', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, mensaje })
        });

        if (response.ok) {
            mensajeInput.value = '';
            await cargarChat();
        } else {
            console.error("Server responded with error:", response.status);
            let errorText = "";
            try { errorText = await response.text(); } catch (e) { }
            alert(`Error del servidor (${response.status}): ${errorText || "No se pudo enviar el mensaje."}`);
        }
    } catch (e) {
        console.error("Error sending message", e);
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

        // Use relative URL
        const res = await fetch('/api/leer-chat');
        const data = await res.json();
        const mensajes = Array.isArray(data) ? data : (data.mensajes || []);

        if (mensajes.length > lastMessageCount && lastMessageCount !== 0) {
            // Optional: Sound or visual cue
        }
        lastMessageCount = mensajes.length;

        box.innerHTML = mensajes.map(m => {
            let timeStr = '';
            if (m.fecha) {
                const date = new Date(m.fecha);
                // Check validation (though server now sends formatted string, checking is safe)
                // Note: Server says it sends locale string '10:30 PM'. new Date('10:30 PM') might be Invalid Date in some browsers depending on locale/date.
                // IF the server sends "10:30 PM", new Date() might fail.
                // Server code: new Date().toLocaleTimeString(...) -> returns string.
                // If we pass that string to new Date(), it might work or fail.
                // Fix: The server sends a DISPLAY string in 'fecha', not an ISO string.
                // So we should just display it directly if it's already formatted?
                // Let's assume server sends a displayable string now.
                // But wait, the previous code tried to parse it.
                // If server is "10:30", new Date("10:30") is Invalid.
                // I will just display m.fecha directly if parsing fails, or trust it is a string.

                // Let's try to parse, if invalid, use string as is?
                // Actually, looking at server.js: fecha: new Date().toLocaleTimeString(...)
                // This returns a string like "10:30:00" or "10:30 a. m.".
                // So we should just print it.
                timeStr = m.fecha;
            }

            // Should we try to re-format? 
            // If it's already "10:30", just use it. 
            // The previous logic was `new Date(m.fecha)`. This was probably failing because of the localized string format.
            // Since I control server.js now and it sends a formatted string, I can just use it.

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
