// scripts/logica_pedidos.js
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    const STATION_ID = 1;
    const DEFAULT_PLAYLIST_ID = 1;
    const SONGS_PER_PAGE = 25;

    // --- ELEMENTOS DEL DOM ---
    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');

    // --- VARIABLES ---
    let allSongsFromPlaylist = [];
    let currentlyDisplayedSongs = [];
    let currentPage = 1;
    let isLoading = false;

    // --- FUNCIONES DE ESTADO ---
    function showStatus(message, isSuccess = true) {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.className = isSuccess ? 'status-success' : 'status-error';
        statusMessage.style.display = 'block';
        setTimeout(() => { statusMessage.style.display = 'none'; }, 5000);
    }

    // --- RENDERIZADO ---
    function appendSongsToDOM(songs) {
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

    function renderMoreSongs() {
        const start = currentPage * SONGS_PER_PAGE;
        const nextSongs = allSongsFromPlaylist.slice(start, start + SONGS_PER_PAGE);
        appendSongsToDOM(nextSongs);
        currentlyDisplayedSongs = currentlyDisplayedSongs.concat(nextSongs);
        currentPage++;
    }

    // --- PETICIONES A LA API ---
    async function fetchAllSongs() {
        isLoading = true;
        if (resultsContainer) resultsContainer.innerHTML = '<p>Cargando lista de canciones…</p>';

        try {
            const response = await fetch(`/api/station/${STATION_ID}/requests`);
            if (!response.ok) throw new Error('No se pudo conectar con el servidor.');

            const allSongsFromApi = await response.json();
            if (allSongsFromApi.error) throw new Error(allSongsFromApi.error);

            // Filtrar por playlist si es necesario
            allSongsFromPlaylist = allSongsFromApi.filter(song =>
                song?.song?.playlists?.some(pl => pl.id === DEFAULT_PLAYLIST_ID)
            );

            console.log(`[DEBUG] ${allSongsFromPlaylist.length} canciones encontradas en playlist ${DEFAULT_PLAYLIST_ID}.`);
            renderInitialSongs(allSongsFromPlaylist);

        } catch (error) {
            console.error('ERROR EN fetchAllSongs:', error);
            if (resultsContainer) resultsContainer.innerHTML = `<p style="color: red;">No se pudo cargar la lista de canciones.</p>`;
        } finally {
            isLoading = false;
        }
    }

    async function requestSong(event) {
        if (!event.target.classList.contains('request-btn')) return;

        const button = event.target;
        const requestId = button.dataset.requestId;
        button.disabled = true;
        button.textContent = 'Enviando…';

        try {
            const response = await fetch(`/api/station/${STATION_ID}/request/${requestId}`, { method: 'POST' });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Error al enviar el pedido.');
            if (result.success) {
                showStatus(result.message || '¡Pedido enviado!', true);
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
            }, 10000);
        }
    }

    // --- FILTRADO ---
    function filterSongs() {
        const query = searchBox.value.trim().toLowerCase();
        const filtered = allSongsFromPlaylist.filter(song =>
            song.song.title.toLowerCase().includes(query) ||
            song.song.artist.toLowerCase().includes(query)
        );
        renderInitialSongs(filtered);
    }

    // --- SCROLL INFINITO ---
    function handleScroll() {
        if (isLoading) return;
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
            const totalPages = Math.ceil(allSongsFromPlaylist.length / SONGS_PER_PAGE);
            if (currentPage < totalPages) {
                renderMoreSongs();
            }
        }
    }

    // --- EVENTOS ---
    if (searchBox) searchBox.addEventListener('input', filterSongs);
    if (resultsContainer) resultsContainer.addEventListener('click', requestSong);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // --- CARGA INICIAL ---
    fetchAllSongs();
});
