// scripts/pedidos-logic.js (Versión SÚPER SIMPLE)

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN BÁSICA ---
    const STATION_ID = 1;
    const DEFAULT_PLAYLIST_ID = 1;

    // --- ELEMENTOS DEL DOM ---
    const resultsContainer = document.getElementById('results-container');
    const searchBox = document.getElementById('search-box');
    
    let songsFromPlaylist = []; // Aquí guardaremos las canciones buenas

    /**
     * Dibuja las canciones en la pantalla.
     */
    function renderSongs(songsToRender) {
        resultsContainer.innerHTML = ''; // Limpiamos

        if (!songsToRender || songsToRender.length === 0) {
            resultsContainer.innerHTML = '<p>No hay canciones pedibles en la playlist principal en este momento.</p>';
            return;
        }

        songsToRender.forEach(song => {
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

    /**
     * La única función principal: pide y filtra.
     */
    async function initializeRequests() {
        console.log("1. Iniciando petición de canciones...");
        resultsContainer.innerHTML = '<p>Cargando canciones...</p>';

        try {
            // Pedimos la lista completa a nuestro servidor
            const response = await fetch(`/api/get-request-list/${STATION_ID}`);
            if (!response.ok) throw new Error('El servidor no respondió correctamente.');

            const allSongsFromApi = await response.json();
            console.log(`2. Recibidas ${allSongsFromApi.length} canciones en total de la API.`);

            // Filtramos por las que pertenecen a la playlist y son pedibles
            songsFromPlaylist = allSongsFromApi.filter(song => {
                const belongsToPlaylist = song && song.song && Array.isArray(song.song.playlists) &&
                                          song.song.playlists.some(playlist => playlist.id === DEFAULT_PLAYLIST_ID);
                return belongsToPlaylist && song.is_requestable;
            });
            
            console.log(`3. Encontradas ${songsFromPlaylist.length} canciones pedibles de la playlist ${DEFAULT_PLAYLIST_ID}.`);

            // Mostramos el resultado
            renderSongs(songsFromPlaylist);

        } catch (error) {
            console.error('ERROR FATAL:', error);
            resultsContainer.innerHTML = `<p style="color: red;">Error crítico al cargar las canciones. Revisa la consola.</p>`;
        }
    }
    
    /**
     * Función de búsqueda simple.
     */
    function filterOnSearch() {
        const query = searchBox.value.toLowerCase().trim();
        const filtered = songsFromPlaylist.filter(song =>
            song.song.title.toLowerCase().includes(query) ||
            song.song.artist.toLowerCase().includes(query)
        );
        renderSongs(filtered);
    }
    
    // --- El resto de funciones (como requestSong) se quedan igual ---
    async function requestSong(event) { /* ... Pega aquí tu función requestSong sin cambios ... */ }


    // --- EVENT LISTENERS ---
    searchBox.addEventListener('input', filterOnSearch);
    resultsContainer.addEventListener('click', requestSong);

    // Inicia todo
    initializeRequests();
});

// ¡IMPORTANTE! Pega aquí debajo tu función showStatus y requestSong completas
// que ya teníamos, para que los botones de pedir sigan funcionando.

async function requestSong(event) {
    if (!event.target.classList.contains('request-btn')) return;

    const button = event.target;
    const requestId = button.dataset.requestId;
    button.disabled = true;
    button.textContent = 'Enviando...';

    try {
        const response = await fetch(`/api/send-song-request/1/${requestId}`, { method: 'POST' }); // Asumimos STATION_ID=1
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'El servidor devolvió un error.');
        }
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        if (result.success) {
            showStatus(result.message || '¡Tu pedido se ha enviado con éxito!', true);
        } else {
            throw new Error(result.message || 'No se pudo enviar el pedido.');
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

function showStatus(message, isSuccess = true) {
    const statusMessage = document.getElementById('status-message');
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = isSuccess ? 'status-success' : 'status-error';
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}