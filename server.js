// server.js (Versión Corregida y Robusta)

// 1. Importar herramientas
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Servir archivos estáticos (tu web construida por Eleventy)
app.use(express.static(path.join(__dirname, '_site')));

// ==========================================================
// ENDPOINT DE API PARA SPOTIFY (CORREGIDO Y MEJORADO)
// ==========================================================
app.get('/api/spotify-releases', async (req, res) => {
  console.log('[LOG] Petición recibida en /api/spotify-releases');
  
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[ERROR][Spotify] Claves de API no configuradas en las variables de entorno.");
    return res.status(500).json({ error: 'Configuración de Spotify incompleta.' });
  }

  try {
    // --- PASO A: Obtener el token de acceso de Spotify ---
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
        // Lanzamos un error claro si la autenticación falla
        throw new Error(`Error de autenticación con Spotify: ${tokenData.error_description || 'Credenciales inválidas'}`);
    }
    const accessToken = tokenData.access_token;

    // --- PASO B: Pedir los nuevos lanzamientos usando el token ---
    const releasesResponse = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });

    const releasesData = await releasesResponse.json();
    if (!releasesResponse.ok) {
        // Lanzamos un error si la petición de lanzamientos falla
        throw new Error(`Error al obtener lanzamientos de Spotify: ${releasesData.error?.message || 'Respuesta inesperada'}`);
    }

    // Enviamos solo los datos que necesitamos
    res.status(200).json(releasesData.albums.items);

  } catch (error) {
    console.error('[ERROR FATAL][Spotify]', error.message);
    res.status(500).json({ error: 'Fallo al obtener los lanzamientos de Spotify.' });
  }
});


// ==========================================================
// ENDPOINTS DE API PARA PEDIDOS DE AZURACAST (SIN CAMBIOS, YA FUNCIONABA)
// =================================e=========================
app.get('/api/get-request-list/:stationId', async (req, res) => {
    // ... La lógica de AzuraCast que ya teníamos y que sabemos que funciona bien
    const stationId = req.params.stationId;
    const azuracastUrl = process.env.AZURACAST_URL;
    const apiKey = process.env.AZURACAST_API_KEY;

    if (!stationId || !azuracastUrl || !apiKey) {
        return res.status(500).json({ error: 'Configuración de AzuraCast incompleta.' });
    }

    try {
        const apiEndpoint = `${azuracastUrl}/api/station/${stationId}/requests`;
        const response = await fetch(apiEndpoint, { headers: { 'Authorization': `Bearer ${apiKey}` } });

        if (!response.ok) throw new Error(`Error de AzuraCast: ${response.status}`);
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('[ERROR FATAL][AzuraCast]', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/send-song-request/:stationId/:requestId', async (req, res) => {
    // ... La lógica de enviar el pedido, que también funciona bien
    const { stationId, requestId } = req.params;
    const azuracastUrl = process.env.AZURACAST_URL;
    const apiKey = process.env.AZURACAST_API_KEY;

    if (!stationId || !requestId || !azuracastUrl || !apiKey) {
        return res.status(500).json({ error: 'Faltan parámetros.' });
    }
  
    try {
        const apiEndpoint = `${azuracastUrl}/api/station/${stationId}/request/${requestId}`;
        const response = await fetch(apiEndpoint, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}` } });

        if (!response.ok) throw new Error(`Error al enviar el pedido: ${response.status}`);
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('[ERROR FATAL][AzuraCast Request]', error.message);
        res.status(500).json({ error: error.message });
    }
});


// ==========================================================
// INICIAR EL SERVIDOR
// ==========================================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});