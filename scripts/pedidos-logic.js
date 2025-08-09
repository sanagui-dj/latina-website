// scripts/pedidos-logic.js (Versión con Filtro de "is_requestable" DESACTIVADO para depuración)

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    const STATION_ID = 1;
    const SONGS_PER_PAGE = 25;

    // --- ELEMENTOS DEL DOM ---
    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');

    let allRequestableSongs = [];
    let currentlyDisplayedSongs = [];
    let currentPage = 1;
    let isLoading = false;

    // --- FUNCIONES ---

    function showStatus(message, isSuccess = true) { /* ... sin cambios ... */ }

    // Función para renderizar CUALQUIER lista de canciones desde el principio
    function renderInitialSongs(songsToRender) {
        console.log("[DEBUG] renderInitialSongs llamado con", songsToRender.length, "canciones.");
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        if (!songsToRender || songsToRender.length === 0) {
            // Este mensaje ahora solo debería aparecer si la API no devuelve NADA.
            resultsContainer.innerHTML = '<p>No se encontraron canciones en la biblioteca de la radio.</p>';
            return;
        }

        currentlyDisplayedSongs = songsToRender.slice(0, SONGS_PER_PAGE);
        currentPage = 1;
        
        console.log("[DEBUG] Mostrando las primeras", currentlyDisplayedSongs.length, "canciones.");
        appendSongsToDOM(currentlyDisplayedSongs);
    }
    
    // Función para AÑADIR más canciones al final de la lista
    function renderMoreSongs() { /* ... sin cambios ... */ }

    // Función auxiliar para crear y añadir los elementos HTML al DOM
    function appendSongsToDOM(songs) {
        songs.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.className = 'song-item';
            // Esta lógica es clave: el botón se deshabilita si is_requestable es false.
            songDiv.innerHTML = `
                <div class="song-info">
                    <strong>${song.song.title}</strong><br>
                    <span>${song.song.artist}</span>
                </div>
                <button class="request-btn" data-request-id="${song.request_id}" ${!song.is_requestable ? 'disabled' : ''}>${song.is_requestable ? 'Pedir' : 'No disponible'}</button>
            `;
            resultsContainer.appendChild(songDiv);
        });
    }

    async function fetchAllSongs() {
        if (isLoading) return;
        isLoading = true;
        if (resultsContainer) resultsContainer.innerHTML = '<p>Cargando lista de canciones...</p>';
        console.log("[DEBUG] Iniciando fetchAllSongs...");

        try {
            const response = await fetch(`/api/get-request-list/${STATION_ID}`);
            if (!response.ok) throw new Error('No se pudo conectar con el servidor de la radio.');
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            console.log("[DEBUG] API devolvió", data.length, "canciones en total.");
            
            // ==========================================================
            // ¡AQUÍ ESTÁ EL CAMBIO!
            // Comentamos el filtro para mostrar TODAS las canciones.
            // allRequestableSongs = data.filter(song => song.is_requestable);
            allRequestableSongs = data; // AHORA mostramos todo lo que la API nos da.
            // ==========================================================
            
            console.log("[DEBUG] Guardadas", allRequestableSongs.length, "canciones en total (sin filtrar).");
            
            renderInitialSongs(allRequestableSongs);

        } catch (error) {
            console.error('ERROR EN fetchAllSongs:', error);
            if (resultsContainer) resultsContainer.innerHTML = `<p style="color: red;">No se pudo cargar la lista de canciones.</p>`;
        } finally {
            isLoading = false;
        }
    }

    async function requestSong(event) { /* ... sin cambios ... */ }

    function filterSongs() { /* ... sin cambios ... */ }
    
    function handleScroll() { /* ... sin cambios ... */ }

    // --- EVENT LISTENERS ---
    if (searchBox) searchBox.addEventListener('input', filterSongs);
    if (resultsContainer) resultsContainer.addEventListener('click', requestSong);
    window.addEventListener('scroll', handleScroll, { passive: true });

    fetchAllSongs();
});