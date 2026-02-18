let mediaRecorder;
let audioChunks = [];
const recordBtn = document.getElementById('record-btn');
const statusLabel = document.getElementById('status');

recordBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
            // Pedir permiso para el micrófono
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/ogg' });
                const nombre = document.getElementById('user-name').value || 'Anónimo';
                
                statusLabel.innerText = "Enviando...";
                await enviarNotaDeVoz(audioBlob, nombre);
            };

            mediaRecorder.start();
            recordBtn.innerText = "🛑 Detener y Enviar";
            recordBtn.style.backgroundColor = "#ff4d4d"; // Cambio de color visual
            statusLabel.innerText = "Grabando...";
        } catch (err) {
            console.error("No se pudo acceder al micrófono:", err);
            statusLabel.innerText = "❌ Error: Micrófono no disponible";
        }
    } else {
        mediaRecorder.stop();
        recordBtn.innerText = "🎤 Grabar Nota de Voz";
        recordBtn.style.backgroundColor = ""; // Vuelve al color original
    }
});

async function enviarNotaDeVoz(blobAudio, nombreUsuario) {
    const formData = new FormData();
    formData.append('audio', blobAudio, 'voz.ogg'); 
    formData.append('nombre', nombreUsuario);

    try {
        // REEMPLAZA CON TU IP DE LINUX REAL
        const response = await fetch('http://162.250.190.237:3000/api/nota-voz', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            statusLabel.innerText = "✅ ¡Enviado al Staff!";
            setTimeout(() => statusLabel.innerText = "Listo", 3000);
        } else {
            statusLabel.innerText = "❌ Error al enviar";
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        statusLabel.innerText = "❌ Error de conexión con el servidor";
    }
}