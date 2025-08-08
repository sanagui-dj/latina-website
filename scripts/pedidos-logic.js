// --- CONFIGURACIÓN ---
const STATION_ID = 1; // Revisa que este sea tu ID de estación
const SONGS_PER_PAGE = 20; // Cantidad de canciones a cargar por cada "página"

// --- ELEMENTOS DEL DOM ---
const searchBox = document.getElementById('search-box');
const resultsContainer = document.getElementById('results-container');
const statusMessage = document.getElementById('status-message');

let allSongs = [];
let currentPage = 1;
let isLoading = false;
let allSongsLoaded = false;

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

function renderMoreSongs(songs) {
    if (!resultsContainer) return;

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
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function fetchSongs(page = 1) {
    if (isLoading || allSongsLoaded) {
        return;
    }
    isLoading = true;

    if (page === 1 && resultsContainer) {
        resultsContainer.innerHTML = '<p>Cargando lista de canciones...</p>';
    } else if (resultsContainer) {
        const loadingIndicator = document.createElement('p');
        loadingIndicator.textContent = 'Cargando más canciones...';
        loadingIndicator.id = 'loading-indicator';
        resultsContainer.appendChild(loadingIndicator);
    }

    const offset = (page - 1) * SONGS_PER_PAGE;

    try {
        const response = await fetch(`/api/get-request-list/${STATION_ID}?limit=${SONGS_PER_PAGE}&offset=${offset}`);
        if (!response.ok) {
            throw new Error(`El servidor respondió con un error: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        if (data.songs.length === 0) {
            allSongsLoaded = true;
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            return;
        }

        if (page === 1) {
            allSongs = data.songs;
            renderSongs(allSongs);
        } else {
            allSongs = [...allSongs, ...data.songs];
            renderMoreSongs(data.songs);
        }

        currentPage++;
    } catch (error) {
        console.error('ERROR EN fetchSongs:', error);
        if (page === 1 && resultsContainer) {
            resultsContainer.innerHTML = `<p style="color: red;">No se pudo cargar la lista de canciones. Por favor, inténtalo de nuevo más tarde.</p>`;
        } else {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
                const errorMessage = document.createElement('p');
                errorMessage.style.color = 'red';
                errorMessage.textContent = 'Error al cargar más canciones.';
                resultsContainer.appendChild(errorMessage);
            }
        }
    } finally {
        isLoading = false;
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
            throw new Error(errorData.message || 'El servidor devolvió un error.');
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
    allSongsLoaded = true; // Consideramos la lista filtrada como completa para el scroll
}

function handleScroll() {
    if (isLoading || allSongsLoaded) {
        return;
    }

    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition + windowHeight > documentHeight - 300) {
        fetchSongs(currentPage);
    }
}

// --- EVENT LISTENERS ---
if (searchBox) {
    searchBox.addEventListener('input', filterSongs);
}

if (resultsContainer) {
    resultsContainer.addEventListener('click', requestSong);
}

window.addEventListener('scroll', handleScroll);

fetchSongs(currentPage); // Carga la primera página al inicio