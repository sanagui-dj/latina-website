// scripts/pedidos-logic.js (Versión Corregida del Buffet)

document.addEventListener('DOMContentLoaded', () => {

    const STATION_ID = 1;
    const SONGS_PER_PAGE = 25;

    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');

    let allRequestableSongs = [];
    let currentlyDisplayedSongs = [];
    let currentPage = 1;
    let isLoading = false;

    // --- FUNCIONES ---

    function showStatus(message, isSuccess = true) { /* ... sin cambios ... */ }

    function renderInitialSongs(songsToRender) {
        console.log("[DEBUG] renderInitialSongs llamado con", songsToRender.length, "canciones.");
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        if (!songsToRender || songsToRender.length === 0) {
            resultsContainer.innerHTML = '<p>Lo sentimos, no hay canciones disponibles para pedir en este momento.</p>';
            return;
        }

        // --- ¡LA CORRECCIÓN LÓGICA ESTÁ AQUÍ! ---
        // 1. Actualizamos la lista de canciones mostradas.
        currentlyDisplayedSongs = songsToRender.slice(0, SONGS_PER_PAGE);
        // 2. Reseteamos la página a 1.
        currentPage = 1;
        
        console.log("[DEBUG] Mostrando las primeras", currentlyDisplayedSongs.length, "canciones.");
        // 3. Mostramos esas canciones en el DOM.
        appendSongsToDOM(currentlyDisplayedSongs);
    }
    
    function renderMoreSongs() {
        if (isLoading) return;

        // No cargues más si lo que se muestra es un resultado de búsqueda
        if (searchBox && searchBox.value.trim() !== '') return;
        
        // Comprobamos si ya hemos mostrado todo
        if (currentlyDisplayedSongs.length >= allRequestableSongs.length) {
            console.log("[DEBUG] Todas las canciones ya están cargadas.");
            return;
        }

        isLoading = true;
        console.log("[DEBUG] Cargando más canciones...");

        const nextPage = currentPage + 1;
        const start = currentPage * SONGS_PER_PAGE;
        const end = nextPage * SONGS_PER_PAGE;
        const newSongs = allRequestableSongs.slice(start, end);

        if (newSongs.length > 0) {
            appendSongsToDOM(newSongs);
            currentlyDisplayedSongs.push(...newSongs); // Usamos spread syntax para añadir al array
            currentPage = nextPage;
            console.log("[DEBUG] Añadidas", newSongs.length, "canciones. Total mostrado:", currentlyDisplayedSongs.length);
        }
        
        isLoading = false;
    }

    function appendSongsToDOM(songs) { /* ... sin cambios ... */ }

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
            allRequestableSongs = data.filter(song => song.is_requestable);
            console.log("[DEBUG] Encontradas", allRequestableSongs.length, "canciones pedibles.");
            
            renderInitialSongs(allRequestableSongs);

        } catch (error) {
            console.error('ERROR EN fetchAllSongs:', error);
            if (resultsContainer) resultsContainer.innerHTML = `<p style="color: red;">No se pudo cargar la lista de canciones.</p>`;
        } finally {
            isLoading = false;
        }
    }

    async function requestSong(event) { /* ... sin cambios ... */ }

    function filterSongs() {
        if (!searchBox) return;
        const query = searchBox.value.toLowerCase().trim();
        
        if (!query) {
            renderInitialSongs(allRequestableSongs);
            return;
        }
        
        const filteredSongs = allRequestableSongs.filter(song =>
            song.song.title.toLowerCase().includes(query) ||
            song.song.artist.toLowerCase().includes(query)
        );
        renderInitialSongs(filteredSongs); 
    }
    
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

    fetchAllSongs();
});