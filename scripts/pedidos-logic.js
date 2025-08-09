// scripts/logica_pedidos.js (Versión Final con Filtro por Playlist ID y Paginación)

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    const STATION_ID = 1; // El ID de tu estación de radio.
    const DEFAULT_PLAYLIST_ID = 1; // ¡CONFIRMADO! El ID de tu playlist principal.
    const SONGS_PER_PAGE = 25; // Número de canciones a mostrar por "página" de scroll.

    // --- ELEMENTOS DEL DOM ---
    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');

    // --- VARIABLES DE ESTADO ---
    let allSongsFromPlaylist = []; // Aquí guardaremos TODAS las canciones de la playlist default.
    let currentlyDisplayedSongs = []; // Las canciones que se están mostrando actualmente en la página.
    let currentPage = 1;
    let isLoading = false;

    // --- FUNCIONES ---

    /**
     * Muestra un mensaje de estado (éxito o error) al usuario.
     */
    function showStatus(message, isSuccess = true) {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.className = isSuccess ? 'status-success' : 'status-error';
        statusMessage.style.display = 'block';
        setTimeout(() => { statusMessage.style.display = 'none'; }, 5000);
    }

    /**
     * Dibuja la primera "página" de canciones en el DOM. Limpia cualquier contenido anterior.
     */
    function renderInitialSongs(songsToRender) {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = ''; // Limpiamos la lista.

        if (!songsToRender || songsToRender.length === 0) {
            resultsContainer.innerHTML = '<p>Lo sentimos, no hay canciones disponibles para pedir en esta playlist.</p>';
            return;
        }

        currentlyDisplayedSongs = songsToRender.slice(0, SONGS_PER_PAGE);
        currentPage = 1;
        appendSongsToDOM(currentlyDisplayedSongs);
    }

    /**
     * Añade la siguiente "página" de canciones al final de la lista actual (Scroll Infinito).
     */
    function renderMoreSongs() {
        if (isLoading || (searchBox && searchBox.value.trim() !== '')) return;

        if (currentlyDisplayedSongs.length >= allSongsFromPlaylist.length) {
            return; // Ya se han mostrado todas las canciones.
        }

        isLoading = true;
        const nextPage = currentPage + 1;
        const start = currentPage * SONGS_PER_PAGE;
        const end = nextPage * SONGS_PER_PAGE;
        const newSongs = allSongsFromPlaylist.slice(start, end);

        if (newSongs.length > 0) {
            appendSongsToDOM(newSongs);
            currentlyDisplayedSongs.push(...newSongs);
            currentPage = nextPage;
        }
        isLoading = false;
    }

    /**
     * Función auxiliar que crea el HTML para un array de canciones y lo añade al contenedor.
     */
    function appendSongsToDOM(songs) {
        songs.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.className = 'song-item';
            songDiv.innerHTML = `
                <div class="song-info">
                    <strong>${song.song.title}</strong><br>
                    <span>${song.song.artist}</span>
                </div>
                <button class="request-btn" data-request-id="${song.request_id}" ${!song.is_requestable ? 'disabled' : ''}>
                    ${song.is_requestable ? 'Pedir' : 'No disponible'}
                </button>
            `;
            resultsContainer.appendChild(songDiv);
        });
    }

    /**
     * La función principal que se conecta a nuestro servidor para obtener la lista completa de canciones.
     */
    async function fetchAllSongs() {
        isLoading = true;
        if (resultsContainer) resultsContainer.innerHTML = '<p>Cargando lista de canciones...</p>';

        try {
            const response = await fetch(`/api/get-request-list/${STATION_ID}`);
            if (!response.ok) throw new Error('No se pudo conectar con el servidor de la radio.');
            
            const allSongsFromApi = await response.json();
            if (allSongsFromApi.error) throw new Error(allSongsFromApi.error);

            // Filtramos para quedarnos solo con las canciones de nuestra playlist 'default'
            const songsFromDefaultPlaylist = allSongsFromApi.filter(song =>
                song.song.playlists.some(playlist => playlist.id === DEFAULT_PLAYLIST_ID)
            );

            // De esas, filtramos solo las que se pueden pedir
            allSongsFromPlaylist = songsFromDefaultPlaylist.filter(song => song.is_requestable);
            
            // Mostramos la primera página de las canciones filtradas
            renderInitialSongs(allSongsFromPlaylist);

        } catch (error) {
            console.error('ERROR EN fetchAllSongs:', error);
            if (resultsContainer) resultsContainer.innerHTML = `<p style="color: red;">No se pudo cargar la lista de canciones.</p>`;
        } finally {
            isLoading = false;
        }
    }

    /**
     * Envía una solicitud para pedir una canción específica.
     */
    async function requestSong(event) {
        if (!event.target.classList.contains('request-btn')) return;

        const button = event.target;
        const requestId = button.dataset.requestId;
        button.disabled = true;
        button.textContent = 'Enviando...';

        try {
            const response = await fetch(`/api/send-song-request/${STATION_ID}/${requestId}`, { method: 'POST' });
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

    /**
     * Filtra la lista de canciones mostrada según lo que escribe el usuario en la caja de búsqueda.
     */
    function filterSongs() {
        if (!searchBox) return;
        const query = searchBox.value.toLowerCase().trim();
        
        if (!query) {
            renderInitialSongs(allSongsFromPlaylist);
            return;
        }
        
        const filteredSongs = allSongsFromPlaylist.filter(song =>
            song.song.title.toLowerCase().includes(query) ||
            song.song.artist.toLowerCase().includes(query)
        );
        renderInitialSongs(filteredSongs);
    }
    
    /**
     * Gestiona el evento de scroll para cargar más canciones.
     */
    function handleScroll() {
        if (isLoading) return;
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            renderMoreSongs();
        }
    }

    // --- EVENT LISTENERS ---
    if (searchBox) searchBox.addEventListener('input', filterSongs);
    if (resultsContainer) resultsContainer.addEventListener('click', requestSong);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Inicia todo el proceso
    fetchAllSongs();
});