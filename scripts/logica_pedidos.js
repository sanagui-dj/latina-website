// scripts/logica_pedidos.js

// --- CONFIGURACIÓN ---
// ¡RELLENA ESTE DATO CON EL ID DE TU ESTACIÓN!
const STATION_ID = 1; 

// --- CÓDIGO ---
document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');
    let allSongs = [];

    function showStatus(message, isSuccess = true) {
        statusMessage.textContent = message;
        statusMessage.className = isSuccess ? 'status-success' : 'status-error';
        statusMessage.style.display = 'block';
        setTimeout(() => { statusMessage.style.display = 'none'; }, 5000);
    }

    function renderSongs(songs) {
        resultsContainer.innerHTML = '';
        if (songs.length === 0) {
            resultsContainer.innerHTML = '<p>No se encontraron canciones con ese criterio.</p>';
            return;
        }

        songs.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.className = 'song-item';
            // Usamos song.request_id que es lo que AzuraCast necesita
            songDiv.innerHTML = `
                <div class="song-info">
                    <span class="song-title">${song.song.title}</span>
                    <span class="song-artist">${song.song.artist}</span>
                </div>
                <button class="request-btn" data-request-id="${song.request_id}">Pedir</button>
            `;
            resultsContainer.appendChild(songDiv);
        });
    }

    async function fetchSongs() {
        try {
            const response = await fetch(`/api/get-request-list/${STATION_ID}`);
            if (!response.ok) throw new Error('No se pudo conectar con el servidor de la radio.');
            const songs = await response.json();
            if (songs.error) throw new Error(songs.error);

            allSongs = songs.filter(song => song.is_requestable); // Filtramos solo las que se pueden pedir
            renderSongs(allSongs);
        } catch (error) {
            resultsContainer.innerHTML = `<p style="color: red;">Error al cargar canciones: ${error.message}</p>`;
        }
    }

    async function requestSong(event) {
        if (event.target.classList.contains('request-btn')) {
            const button = event.target;
            const requestId = button.dataset.requestId;

            button.disabled = true;
            button.textContent = 'Enviando...';

            try {
                const response = await fetch(`/api/send-song-request/${STATION_ID}/${requestId}`, {
                    method: 'POST'
                });
                if (!response.ok) throw new Error('El servidor devolvió un error.');

                const result = await response.json();
                if (result.error) throw new Error(result.error);

                if (result.success) {
                    showStatus(result.message || '¡Pedido enviado con éxito!', true);
                } else {
                    throw new Error(result.message || 'No se pudo enviar el pedido.');
                }
            } catch (error) {
                showStatus(error.message, false);
            } finally {
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = 'Pedir';
                }, 60000); // Cooldown de 60 segundos
            }
        }
    }
    
    function filterSongs() {
        const query = searchBox.value.toLowerCase().trim();
        if (!query) {
            renderSongs(allSongs);
            return;
        }
        const filteredSongs = allSongs.filter(song => 
            song.song.title.toLowerCase().includes(query) || 
            song.song.artist.toLowerCase().includes(query)
        );
        renderSongs(filteredSongs);
    }

    // Event Listeners
    fetchSongs();
    resultsContainer.addEventListener('click', requestSong);
    searchBox.addEventListener('input', filterSongs);
});