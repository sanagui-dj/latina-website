let mediaRecorder;
let audioChunks = [];
const recordBtn = document.getElementById('record-btn');
const statusLabel = document.getElementById('status');

recordBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
            // Pedir permiso para el micrófono
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Configuración de formato compatible con la mayoría de navegadores y Telegram
            const options = { mimeType: 'audio/webm' }; 
            mediaRecorder = new MediaRecorder(stream, options);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const nombre = document.getElementById('user-name').value || 'Anónimo';
                
                statusLabel.innerText = "Enviando...";
                await enviarNotaDeVoz(audioBlob, nombre);
                
                // Detener todos los tracks del micrófono para apagar la luz de grabación
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            recordBtn.innerText = "🛑 Detener y Enviar";
            recordBtn.style.backgroundColor = "#ff4d4d"; 
            statusLabel.innerText = "Grabando...";
        } catch (err) {
            console.error("No se pudo acceder al micrófono:", err);
            statusLabel.innerText = "❌ Micrófono no disponible";
        }
    } else {
        mediaRecorder.stop();
        recordBtn.innerText = "🎤 Grabar Nota de Voz";
        recordBtn.style.backgroundColor = ""; 
    }
});

async function enviarNotaDeVoz(blobAudio, nombreUsuario) {
    const formData = new FormData();
    // 'audio' debe coincidir con upload.single('audio') en server.js
    formData.append('audio', blobAudio, 'voz.webm'); 
    formData.append('nombre', nombreUsuario);

    try {
        // NOTA: Si tu web es HTTPS, esta petición podría seguir fallando 
        // hasta que el bot tenga SSL o uses un proxy inverso (como Nginx).
        const response = await fetch('https://latinalive.net/api/nota-voz', {
            method: 'POST',
            // No incluimos headers de Content-Type porque el navegador 
            // los pone automáticamente al usar FormData con archivos.
            body: formData
        });

        if (response.ok) {
            statusLabel.innerText = "✅ ¡Enviado al Staff!";
            setTimeout(() => statusLabel.innerText = "Listo", 3000);
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Error del servidor:", errorData);
            statusLabel.innerText = "❌ Error en el servidor";
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        statusLabel.innerText = "❌ Error de conexión";
    }
}