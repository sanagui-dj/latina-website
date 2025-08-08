// scripts/pedidos-logic.js (Versión Final Funcional)

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURACIÓN ---
    const STATION_ID = 1; // Revisa que este sea tu ID de estación

    // --- ELEMENTOS DEL DOM ---
    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');
    
    let allSongs = [];

    // --- FUNCIONES ---

    function showStatus(message, isSuccess = true) {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.className = isSuccess ? 'status-success' : 'status-error';
        statusMessage.style.display = 'block';
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }

    function renderSongs(songs) {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = '';
        
        if (!songs || songs.length === 0) {
            resultsContainer.innerHTML = '<p>Lo sentimos, no hay canciones disponibles en la lista.</p>';
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
        resultsContainer.innerHTML = '<p>Cargando lista de canciones...</p>';

        try {
            const response = await fetch(`/api/get-request-list/${STATION_ID}`);
            if (!response.ok) {
                throw new Error(`El servidor respondió con un error: ${response.status}`);
            }
            
            const songs = await response.json();
            if (songs.error) {
                throw new Error(songs.error);
            }

            // ===================================================================
            // MODIFICACIÓN CLAVE:
            // Asignamos TODAS las canciones directamente, sin filtrar por 'is_requestable'.
            // Esto replicará el comportamiento del iframe de AzuraCast.
            allSongs = songs;
            // ===================================================================

            renderSongs(allSongs);

        } catch (error) {
            console.error('ERROR EN fetchSongs:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = `<p style="color: red;">No se pudo cargar la lista de canciones. Por favor, inténtalo de nuevo más tarde.</p>`;
            }
        }
    }

    async function requestSong(event) {
        if (!event.target.classList.contains('request-btn')) {
            return;
        }
        
        const button = event.target;
        const requestId = button.dataset.requestId;
        button.disabled = true;
        button.textContent = 'Enviando...';

        try {
            const response = await fetch(`/api/send-song-request/${STATION_ID}/${requestId}`, { method: 'POST' });
            if (!response.ok) {
                const errorData = await response.json();
                // Usamos el mensaje de error de AzuraCast si está disponible
                throw new Error(errorData.message || 'El servidor devolvió un error.');
            }
            
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            if (result.success) {
                showStatus(result.message || '¡Tu pedido se ha enviado con éxito!', true);
            } else {
                // Si success es false, AzuraCast suele enviar un mensaje explicando por qué
                throw new Error(result.message || 'No se pudo enviar el pedido en este momento.');
            }
        } catch (error) {
            console.error('Error al enviar la petición:', error);
            showStatus(error.message, false);
        } finally {
            setTimeout(() => {
                button.disabled = false;
                button.textContent = 'Pedir';
            }, 60000);
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
    if (searchBox) {
        searchBox.addEventListener('input', filterSongs);
    }
    
    if (resultsContainer) {
        resultsContainer.addEventListener('click', requestSong);
    }

    fetchSongs();
});