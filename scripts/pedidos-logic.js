// scripts/pedidos-logic.js (Versión con Paginación del Lado del Cliente)

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    const STATION_ID = 1; // Revisa que este sea tu ID de estación
    const SONGS_PER_PAGE = 25; // Número de canciones a mostrar por "página"

    // --- ELEMENTOS DEL DOM ---
    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');

    let allRequestableSongs = []; // Aquí guardaremos TODAS las canciones pedibles (nuestro "buffet en la cocina")
    let currentlyDisplayedSongs = []; // Las canciones que se están mostrando actualmente
    let currentPage = 1;
    let isLoading = false;

    // --- FUNCIONES ---

    function showStatus(message, isSuccess = true) { /* ... sin cambios ... */ }

    // Función para renderizar la PRIMERA página de canciones
    function renderInitialSongs(songs) {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = '';
        if (!songs || songs.length === 0) {
            resultsContainer.innerHTML = '<p>Lo sentimos, no hay canciones disponibles para pedir en este momento.</p>';
            return;
        }
        currentlyDisplayedSongs = songs.slice(0, SONGS_PER_PAGE);
        currentPage = 1;
        appendSongsToDOM(currentlyDisplayedSongs);
    }
    
    // Función para AÑADIR más canciones al final de la lista
    function renderMoreSongs() {
        if (isLoading) return;
        isLoading = true;

        const nextPage = currentPage + 1;
        const start = currentPage * SONGS_PER_PAGE;
        const end = nextPage * SONGS_PER_PAGE;
        const newSongs = allRequestableSongs.slice(start, end);

        if (newSongs.length > 0) {
            appendSongsToDOM(newSongs);
            currentlyDisplayedSongs = [...currentlyDisplayedSongs, ...newSongs];
            currentPage = nextPage;
        }
        
        // Ocultar el indicador de carga si ya no hay más canciones
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator && end >= allRequestableSongs.length) {
            loadingIndicator.remove();
        }
        isLoading = false;
    }

    // Función auxiliar para crear y añadir los elementos HTML al DOM
    function appendSongsToDOM(songs) {
        songs.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.className = 'song-item';
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
        isLoading = true;
        if (resultsContainer) resultsContainer.innerHTML = '<p>Cargando lista de canciones...</p>';

        try {
            const response = await fetch(`/api/get-request-list/${STATION_ID}`);
            if (!response.ok) throw new Error('No se pudo conectar con el servidor de la radio.');
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Guardamos TODAS las canciones pedibles en nuestro "buffet"
            allRequestableSongs = data.filter(song => song.is_requestable);
            
            // Mostramos solo la primera página
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
        
        // Si la búsqueda está vacía, mostramos la lista paginada original
        if (!query) {
            renderInitialSongs(allRequestableSongs);
            return;
        }
        
        // Si hay una búsqueda, filtramos de TODO el buffet y mostramos los resultados
        const filteredSongs = allRequestableSongs.filter(song =>
            song.song.title.toLowerCase().includes(query) ||
            song.song.artist.toLowerCase().includes(query)
        );
        // "renderInitialSongs" ahora se usa para mostrar cualquier lista desde el principio
        renderInitialSongs(filteredSongs); 
    }
    
    // --- LÓGICA DE SCROLL INFINITO ---
    function handleScroll() {
        // No cargamos más si se está buscando algo
        if (searchBox.value.trim() !== '') return; 
        
        if (isLoading) return;
        
        // Comprobamos si el usuario ha llegado casi al final de la página
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            renderMoreSongs();
        }
    }

    // --- EVENT LISTENERS ---
    if (searchBox) searchBox.addEventListener('input', filterSongs);
    if (resultsContainer) resultsContainer.addEventListener('click', requestSong);
    window.addEventListener('scroll', handleScroll, { passive: true }); // Usamos passive para mejor rendimiento

    fetchAllSongs(); // Carga el buffet completo en segundo plano y muestra la primera página
});