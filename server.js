// server.js

// 1. Importar las herramientas necesarias
const express = require('express');
const path = require('path');
const app = express();

// 2. Definir el puerto (Render lo proporciona)
const PORT = process.env.PORT || 3000;

// 3. Servir los archivos estáticos de la carpeta '_site' (tu web construida por Eleventy)
app.use(express.static(path.join(__dirname, '_site')));

// ==========================================================
// ENDPOINT DE API PARA SPOTIFY (YA LO TENÍAMOS)
// ==========================================================
app.get('/api/spotify-releases', async (req, res) => {
  console.log('Petición recibida en /api/spotify-releases');
  
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Configuración de Spotify incompleta.' });
  }

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Error al obtener token de Spotify');

    const releasesResponse = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', {
      headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
    });

    const releasesData = await releasesResponse.json();
    if (!releasesResponse.ok) throw new Error(releasesData.error?.message || 'Error al obtener lanzamientos de Spotify');

    res.status(200).json(releasesData.albums.items);

  } catch (error) {
    console.error('Error en API de Spotify:', error.message);
    res.status(500).json({ error: 'Fallo al obtener los lanzamientos de Spotify.' });
  }
});


// ==========================================================
// ENDPOINTS DE API PARA PEDIDOS DE AZURACAST (LO NUEVO)
// ==========================================================

// --- Ruta para OBTENER la lista de canciones que se pueden pedir ---
app.get('/api/get-request-list/:stationId', async (req, res) => {
  const stationId = req.params.stationId;
  const azuracastUrl = process.env.AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;

  if (!stationId || !azuracastUrl || !apiKey) {
    return res.status(500).json({ error: 'Configuración del servidor de AzuraCast incompleta.' });
  }

  try {
    const apiEndpoint = `${azuracastUrl}/api/station/${stationId}/requests`;
    const response = await fetch(apiEndpoint, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) throw new Error(`No se pudo obtener la lista de canciones. Código: ${response.status}`);
    
    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Error en get-request-list:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Ruta para ENVIAR la solicitud de una canción ---
// Usamos POST porque estamos creando un recurso (un pedido)
app.post('/api/send-song-request/:stationId/:requestId', async (req, res) => {
  const { stationId, requestId } = req.params;
  const azuracastUrl = process.env.AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;

  if (!stationId || !requestId || !azuracastUrl || !apiKey) {
    return res.status(500).json({ error: 'Faltan parámetros o configuración.' });
  }
  
  try {
    const apiEndpoint = `${azuracastUrl}/api/station/${stationId}/request/${requestId}`;
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) throw new Error(`La API de AzuraCast devolvió un error. Código: ${response.status}`);
    
    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Error en send-song-request:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// ==========================================================
// INICIAR EL SERVIDOR
// ==========================================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});