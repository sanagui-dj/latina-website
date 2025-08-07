// scripts/pedidos-logic.js (Versión Corregida)

// Asegurarnos de que el código se ejecuta solo cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURACIÓN ---
    const STATION_ID = 1; // Revisa que este sea tu ID de estación

    // --- ELEMENTOS DEL DOM ---
    // Usamos 'const' porque estas variables no cambiarán
    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');
    
    // Usamos 'let' porque el contenido de este array cambiará
    let allSongs = [];

    // --- FUNCIONES ---

    function showStatus(message, isSuccess = true) {
        if (!statusMessage) return; // Salir si el elemento no existe
        statusMessage.textContent = message;
        statusMessage.className = isSuccess ? 'status-success' : 'status-error';
        statusMessage.style.display = 'block';
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000); // Ocultar después de 5 segundos
    }

    function renderSongs(songs) {
        if (!resultsContainer) return; // Salir si el elemento no existe
        resultsContainer.innerHTML = ''; // Limpiar
        
        if (!songs || songs.length === 0) {
            resultsContainer.innerHTML = '<p>Lo sentimos, no hay canciones disponibles para pedir en este momento.</p>';
            return;
        }

        songs.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.className = 'song-item';
            songDiv.innerHTML = `
                <div class="song-info">
                    <strong>${song.song.title}</strong><br>
                    <span>${song.song.artist}</span>
                </div>
                <button class="request-btn" data-request-id="${song.request_id}">Pedir</button>
            `;
            resultsContainer.appendChild(songDiv);
        });
    }

    async function fetchSongs() {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = '<p>Contactando al servidor de la radio...</p>';

        try {
            const response = await fetch(`/api/get-request-list/${STATION_ID}`);
            if (!response.ok) {
                throw new Error(`El servidor respondió con un error: ${response.status}`);
            }
            
            const songs = await response.json();
            if (songs.error) {
                throw new Error(songs.error);
            }

            // Filtramos las canciones que AzuraCast nos dice que se pueden pedir
            const requestableSongs = songs.filter(song => song.is_requestable);
            
            allSongs = requestableSongs;
            renderSongs(allSongs);

        } catch (error) {
            console.error('ERROR EN fetchSongs:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = `<p style="color: red;">No se pudo cargar la lista de canciones. Por favor, revisa la consola (F12) para ver el error técnico.</p>`;
            }
        }
    }

    async function requestSong(event) {
        if (!event.target.classList.contains('request-btn')) {
            return; // Salir si no se hizo clic en un botón de pedir
        }
        
        const button = event.target;
        const requestId = button.dataset.requestId;
        button.disabled = true;
        button.textContent = 'Enviando...';

        try {
            const response = await fetch(`/api/send-song-request/${STATION_ID}/${requestId}`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('El servidor devolvió un error al enviar el pedido.');
            }
            
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            if (result.success) {
                showStatus(result.message || '¡Tu pedido se ha enviado con éxito!', true);
            } else {
                throw new Error(result.message || 'No se pudo enviar el pedido en este momento.');
            }
        } catch (error) {
            console.error('Error al enviar la petición:', error);
            showStatus(error.message, false);
        } finally {
            // Habilitamos el botón de nuevo después de un cooldown
            setTimeout(() => {
                button.disabled = false;
                button.textContent = 'Pedir';
            }, 60000); // 60 segundos
        }
    }

    function filterSongs() {
        const query = searchBox.value.toLowerCase().trim();
        const filteredSongs = allSongs.filter(song => 
            song.song.title.toLowerCase().includes(query) || 
            song.song.artist.toLowerCase().includes(query)
        );
        renderSongs(filteredSongs);
    }
    
    // --- EVENT LISTENERS ---

    // Asegurarnos de que los elementos existen antes de añadir listeners
    if (searchBox) {
        searchBox.addEventListener('input', filterSongs);
    }
    
    if (resultsContainer) {
        resultsContainer.addEventListener('click', requestSong);
    }

    // Cargar las canciones al iniciar
    fetchSongs();
});