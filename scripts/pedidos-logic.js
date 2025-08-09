// scripts/pedidos-logic.js (Versión "Blindada" a prueba de errores)

document.addEventListener('DOMContentLoaded', () => {

    const STATION_ID = 1;
    const DEFAULT_PLAYLIST_ID = 1;
    const SONGS_PER_PAGE = 25;

    // ... (tus referencias al DOM y variables de estado se quedan igual) ...

    async function fetchAllSongs() {
        isLoading = true;
        if (resultsContainer) resultsContainer.innerHTML = '<p>Cargando lista de canciones...</p>';

        try {
            const response = await fetch(`/api/get-request-list/${STATION_ID}`);
            if (!response.ok) throw new Error('No se pudo conectar con el servidor de la radio.');
            
            const allSongsFromApi = await response.json();
            if (allSongsFromApi.error) throw new Error(allSongsFromApi.error);
            
            console.log(`[DEBUG] API devolvió ${allSongsFromApi.length} canciones en total.`);

            // ==========================================================
            // ¡AQUÍ ESTÁ LA CORRECCIÓN CLAVE!
            // ==========================================================
            const songsFromDefaultPlaylist = allSongsFromApi.filter(song => {
                // ANTES: song.song.playlists.some(...)
                // AHORA (BLINDADO):
                // 1. Verificamos que 'song', 'song.song' y 'song.song.playlists' existen.
                // 2. Y que 'song.song.playlists' es un array (una lista).
                // 3. Solo entonces intentamos usar '.some()'.
                return song && song.song && Array.isArray(song.song.playlists) &&
                       song.song.playlists.some(playlist => playlist.id === DEFAULT_PLAYLIST_ID);
            });
            console.log(`[DEBUG] Encontradas ${songsFromDefaultPlaylist.length} canciones de la playlist default (ID: ${DEFAULT_PLAYLIST_ID}).`);

            const requestableSongs = songsFromDefaultPlaylist.filter(song => song.is_requestable);
            console.log(`[DEBUG] De esas, ${requestableSongs.length} son pedibles.`);
            
            allSongsFromPlaylist = requestableSongs;
            renderInitialSongs(allSongsFromPlaylist);

        } catch (error) {
            console.error('ERROR EN fetchAllSongs:', error);
            if (resultsContainer) resultsContainer.innerHTML = `<p style="color: red;">No se pudo cargar la lista de canciones.</p>`;
        } finally {
            isLoading = false;
        }
    }
    
    // ... (El resto de tus funciones y event listeners se quedan exactamente igual) ...
    // --- Asegúrate de que todas tus funciones estén definidas ---
    function showStatus(message, isSuccess = true) { /* ... */ }
    function renderInitialSongs(songsToRender) { /* ... */ }
    function renderMoreSongs() { /* ... */ }
    function appendSongsToDOM(songs) { /* ... */ }
    async function requestSong(event) { /* ... */ }
    function filterSongs() { /* ... */ }
    function handleScroll() { /* ... */ }

    // Event Listeners
    if (searchBox) searchBox.addEventListener('input', filterSongs);
    if (resultsContainer) resultsContainer.addEventListener('click', requestSong);
    window.addEventListener('scroll', handleScroll, { passive: true });

    fetchAllSongs();
});