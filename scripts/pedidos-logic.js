 scriptspedidos-logic.js

document.addEventListener('DOMContentLoaded', () = {
    
     --- CONFIGURACIÓN ---
    const STATION_ID = 1;  Revisa que este sea tu ID de estación

     --- ELEMENTOS DEL DOM ---
    const searchBox = document.getElementById('search-box');
    const resultsContainer = document.getElementById('results-container');
    const statusMessage = document.getElementById('status-message');
    let allSongs = [];  Caché local para las canciones

     --- FUNCIONES ---

    function showStatus(message, isSuccess = true) {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.className = isSuccess  'status-success'  'status-error';
        statusMessage.style.display = 'block';
        setTimeout(() = { statusMessage.style.display = 'none'; }, 5000);
    }

    function renderSongs(songs) {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = '';
        if (!songs  songs.length === 0) {
            resultsContainer.innerHTML = 'pNo se encontraron canciones que coincidan con tu búsqueda.p';
            return;
        }

        songs.forEach(song = {
            const songDiv = document.createElement('div');
            songDiv.className = 'song-item';
            songDiv.innerHTML = `
                div class=song-info
                    strong${song.song.title}strongbr
                    span${song.song.artist}span
                div
                button class=request-btn data-request-id=${song.request_id}Pedirbutton
            `;
            resultsContainer.appendChild(songDiv);
        });
    }

    async function fetchSongs() {
        try {
            const response = await fetch(`apiget-request-list${STATION_ID}`);
            if (!response.ok) throw new Error(`El servidor respondió con error ${response.status}`);
            
            const songs = await response.json();
            if (songs.error) throw new Error(songs.error);

             SIN FILTRO mostramos todo lo que la API nos da
            allSongs = songs;
            renderSongs(allSongs);

        } catch (error) {
            console.error('Error al cargar la lista de canciones', error);
            if (resultsContainer) resultsContainer.innerHTML = `p style=color red;Error crítico al cargar canciones. Revisa la consola del navegador.p`;
        }
    }

    async function requestSong(event) {
        if (!event.target.classList.contains('request-btn')) return;
        
        const button = event.target;
        const requestId = button.dataset.requestId;
        button.disabled = true;
        button.textContent = 'Enviando...';

        try {
            const response = await fetch(`apisend-song-request${STATION_ID}${requestId}`, { method 'POST' });
            if (!response.ok) throw new Error('El servidor devolvió un error.');
            
            const result = await response.json();
            if (result.error) throw new Error(result.error);

            if (result.success) {
                showStatus(result.message  '¡Tu pedido se ha enviado con éxito!', true);
            } else {
                throw new Error(result.message  'No se pudo enviar el pedido en este momento.');
            }
        } catch (error) {
            console.error('Error al enviar la petición', error);
            showStatus(error.message, false);
        } finally {
            setTimeout(() = {
                button.disabled = false;
                button.textContent = 'Pedir';
            }, 60000);  Cooldown de 60 segundos
        }
    }
    
     --- EVENT LISTENERS ---

     El botón de búsqueda que querías
    searchBox.addEventListener('input', () = {
        const query = searchBox.value.toLowerCase().trim();
        const filteredSongs = allSongs.filter(song = 
            song.song.title.toLowerCase().includes(query)  
            song.song.artist.toLowerCase().includes(query)
        );
        renderSongs(filteredSongs);
    });

     Delegación de eventos para los botones de Pedir
    resultsContainer.addEventListener('click', requestSong);

     Cargar las canciones al iniciar
    fetchSongs();
});