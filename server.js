// server.js (Versión Limpia y Actualizada para OneSignal)

// 1. Importar herramientas
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middlewares
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
// ENDPOINT PARA ENVIAR NOTIFICACIONES PUSH (AHORA CON ONESIGNAL)
// ==========================================================
app.post('/api/send-notification', async (req, res) => {
const { message, locutorId } = req.body;
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
  headings: { "es": "Aviso de Latina Live" },
  contents: { "es": message },
  filters: [{
    field: "tag",
    key: "locutor_uid",
    relation: "=",
    value: locutorId
    }]
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
