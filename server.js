// server.js (Versión Limpia y Actualizada para OneSignal)

// 1. Importar herramientas (ya no necesitamos 'firebase-admin')
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middlewares (sin cambios)
app.use(express.json()); // Para entender peticiones con cuerpo JSON
app.use(express.static(path.join(__dirname, '_site'))); // Servir los archivos estáticos

// ==========================================================
// ENDPOINT DE API PARA SPOTIFY (SIN NINGÚN CAMBIO)
// ==========================================================
app.get('/api/spotify-releases', async (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.status(500).json({ error: 'Configuración de Spotify incompleta.' });
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64') }, body: 'grant_type=client_credentials' });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(`Auth Spotify: ${tokenData.error_description || 'Credenciales inválidas'}`);
    const accessToken = tokenData.access_token;
    const releasesResponse = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', { headers: { 'Authorization': 'Bearer ' + accessToken } });
    const releasesData = await releasesResponse.json();
    if (!releasesResponse.ok) throw new Error(`API Spotify: ${releasesData.error?.message || 'Respuesta inesperada'}`);
    res.status(200).json(releasesData.albums.items);
  } catch (error) {
    console.error('[ERROR FATAL][Spotify]', error.message);
    res.status(500).json({ error: 'Fallo al obtener los lanzamientos de Spotify.' });
  }
});

// ==========================================================
// ENDPOINTS DE API PARA PEDIDOS DE AZURACAST (MODIFICADO SOLO ESTE)
// ==========================================================
app.get('/api/get-request-list/:stationId', async (req, res) => {
    const { stationId } = req.params;
    const { AZURACAST_URL, AZURACAST_API_KEY } = process.env;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 50; // Tamaño por página

    if (!stationId || !AZURACAST_URL || !AZURACAST_API_KEY) {
        return res.status(500).json({ error: 'Configuración de AzuraCast incompleta.' });
    }

    try {
        const apiEndpoint = `${AZURACAST_URL}/api/station/${stationId}/requests`;
        const response = await fetch(apiEndpoint, {
            headers: { 'Authorization': `Bearer ${AZURACAST_API_KEY}` }
        });
        if (!response.ok) throw new Error(`Error de AzuraCast: ${response.status}`);
        
        const fullData = await response.json();

        // Simulación de paginación si AzuraCast no la soporta nativamente
        const total = fullData.length;
        const slicedData = fullData.slice(offset, offset + limit);
        const hasMore = offset + limit < total;

        res.status(200).json({
            total,
            hasMore,
            items: slicedData
        });
    } catch (error) {
        console.error('[ERROR FATAL][AzuraCast]', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/send-song-request/:stationId/:requestId', async (req, res) => {
    const { stationId, requestId } = req.params;
    const { AZURACAST_URL, AZURACAST_API_KEY } = process.env;
    if (!stationId || !requestId || !AZURACAST_URL || !AZURACAST_API_KEY) return res.status(500).json({ error: 'Faltan parámetros.' });
    try {
        const apiEndpoint = `${AZURACAST_URL}/api/station/${stationId}/request/${requestId}`;
        const response = await fetch(apiEndpoint, { method: 'POST', headers: { 'Authorization': `Bearer ${AZURACAST_API_KEY}` } });
        if (!response.ok) throw new Error(`Error al enviar el pedido: ${response.status}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('[ERROR FATAL][AzuraCast Request]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================================
// ENDPOINT PARA ENVIAR NOTIFICACIONES PUSH (AHORA CON ONESIGNAL)
// ==========================================================
app.post('/api/send-notification', async (req, res) => {
  const { message } = req.body;
  const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY } = process.env;

  if (!message) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  }
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return res.status(500).json({ error: 'Configuración de OneSignal incompleta en el servidor.' });
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["Subscribed Users"],
        headings: { "en": "Aviso de Latina Live" },
        contents: { "en": message }
      })
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('[ERROR][OneSignal]', data);
        throw new Error(data.errors ? data.errors.join(', ') : 'Error desconocido de OneSignal');
    }
    
    res.status(200).json({ success: true, message: 'Notificación enviada a través de OneSignal.' });

  } catch (error) {
    console.error('[ERROR FATAL][OneSignal]', error);
    res.status(500).json({ error: `Fallo al enviar la notificación: ${error.message}` });
  }
});

// ==========================================================
// INICIAR EL SERVIDOR (SIN NINGÚN CAMBIO)
// ==========================================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
