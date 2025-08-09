// scripts/logica_pedidos.js (Versión Final Definitiva)

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    const STATION_ID = 1;
    const DEFAULT_PLAYLIST_ID = 1;
    const SONGS_PER_PAGE = 25;

    // --- ELEMENTOS DEL DOM Y VARIABLES ---
    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');

    let allSongsFromPlaylist = []; // Aquí guardaremos TODAS las canciones de la playlist
    let currentlyDisplayedSongs = [];
    let currentPage = 1;
    let isLoading = false;

    // --- FUNCIONES ---

    function showStatus(message, isSuccess = true) {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.className = isSuccess ? 'status-success' : 'status-error';
        statusMessage.style.display = 'block';
        setTimeout(() => { statusMessage.style.display = 'none'; }, 5000);
    }

    // Función auxiliar que crea y añade el HTML al DOM
    function appendSongsToDOM(songs) {
        songs.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.className = 'song-item';
            // ¡IMPORTANTE! TODOS los botones están habilitados por defecto.
            // Dejamos que la API sea el juez.
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
    
    // Funciones de renderizado (sin cambios)
    function renderInitialSongs(songsToRender) {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = '';
        if (!songsToRender || songsToRender.length === 0) {
            resultsContainer.innerHTML = '<p>No se encontraron canciones en la playlist principal.</p>';
            return;
        }
        currentlyDisplayedSongs = songsToRender.slice(0, SONGS_PER_PAGE);
        currentPage = 1;
        appendSongsToDOM(currentlyDisplayedSongs);
    }
    function renderMoreSongs() { /* ... sin cambios ... */ }


    async function fetchAllSongs() {
        isLoading = true;
        if (resultsContainer) resultsContainer.innerHTML = '<p>Cargando lista de canciones...</p>';

        try {
            const response = await fetch(`/api/get-request-list/${STATION_ID}`);
            if (!response.ok) throw new Error('No se pudo conectar con el servidor de la radio.');
            
            const allSongsFromApi = await response.json();
            if (allSongsFromApi.error) throw new Error(allSongsFromApi.error);

            // FILTRAMOS SOLO POR PLAYLIST, IGNORANDO 'is_requestable'
            allSongsFromPlaylist = allSongsFromApi.filter(song =>
                song && song.song && Array.isArray(song.song.playlists) &&
                song.song.playlists.some(playlist => playlist.id === DEFAULT_PLAYLIST_ID)
            );
            
            console.log(`[DEBUG] Encontradas ${allSongsFromPlaylist.length} canciones en la playlist ${DEFAULT_PLAYLIST_ID}. Mostrando la primera página.`);
            
            renderInitialSongs(allSongsFromPlaylist);

        } catch (error) {
            console.error('ERROR EN fetchAllSongs:', error);
            if (resultsContainer) resultsContainer.innerHTML = `<p style="color: red;">No se pudo cargar la lista de canciones.</p>`;
        } finally {
            isLoading = false;
        }
    }

    /**
     * Envía una solicitud y MANEJA EL ERROR ESPECÍFICO de AzuraCast.
     */
    async function requestSong(event) {
        if (!event.target.classList.contains('request-btn')) return;

        const button = event.target;
        const requestId = button.dataset.requestId;
        button.disabled = true;
        button.textContent = 'Enviando...';

        try {
            const response = await fetch(`/api/send-song-request/${STATION_ID}/${requestId}`, { method: 'POST' });
            const result = await response.json(); // Leemos la respuesta SIEMPRE
            
            // Si la respuesta NO fue exitosa (ej: 400 Bad Request), AzuraCast nos dirá por qué.
            if (!response.ok) {
                // El mensaje de error de AzuraCast está en result.message
                throw new Error(result.message || 'El servidor devolvió un error.');
            }

            if (result.success) {
                showStatus(result.message || '¡Tu pedido se ha enviado con éxito!', true);
            } else {
                throw new Error(result.message || 'No se pudo enviar el pedido.');
            }
        } catch (error) {
            console.error('Error al enviar la petición:', error);
            // Mostramos al usuario el error REAL que nos dio la API
            showStatus(error.message, false);
        } finally {
            // Damos un cooldown más corto para que puedan intentar otra canción
            setTimeout(() => {
                button.disabled = false;
                button.textContent = 'Pedir';
            }, 10000); // Cooldown de 10 segundos
        }
    }

    // ... (filterSongs y handleScroll se quedan igual) ...
    function filterSongs() { /* ... */ }
    function handleScroll() { /* ... */ }


    // --- EVENT LISTENERS ---
    if (searchBox) searchBox.addEventListener('input', filterSongs);
    if (resultsContainer) resultsContainer.addEventListener('click', requestSong);
    window.addEventListener('scroll', handleScroll, { passive: true });

    fetchAllSongs();
});