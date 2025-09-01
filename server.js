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
// EVITAR 404 DEL FAVICON (los navegadores lo piden por defecto)
// ==========================================================
app.get('/favicon.ico', (_req, res) => {
  // Responder sin contenido para evitar el 404 en consola
  res.status(204).end();
});

// ==========================================================
// ENDPOINT DE API PARA SPOTIFY (SIN NINGÚN CAMBIO FUNCIONAL)
// ==========================================================
app.get('/api/spotify-releases', async (req, res) => {
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
    if (!tokenResponse.ok) {
      throw new Error(`Auth Spotify: ${tokenData.error_description || 'Credenciales inválidas'}`);
    }

    const accessToken = tokenData.access_token;

    const releasesResponse = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });

    const releasesData = await releasesResponse.json();
    if (!releasesResponse.ok) {
      throw new Error(`API Spotify: ${releasesData.error?.message || 'Respuesta inesperada'}`);
    }

    res.status(200).json(releasesData.albums.items);
  } catch (error) {
    console.error('[ERROR FATAL][Spotify]', error.message);
    res.status(500).json({ error: 'Fallo al obtener los lanzamientos de Spotify.' });
  }
});

// ==========================================================
// ENDPOINT PARA ENVIAR NOTIFICACIONES PUSH (ONESIGNAL)
// ==========================================================
app.post('/api/send-notification', async (req, res) => {
  const { message, locutorId } = req.body;
  const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY } = process.env;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  }

  if (!locutorId || typeof locutorId !== 'string' || !locutorId.trim()) {
    return res.status(400).json({ error: 'locutorId es obligatorio.' });
  }

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return res.status(500).json({ error: 'Configuración de OneSignal incompleta en el servidor.' });
  }

  try {
    const bodyPayload = {
      app_id: ONESIGNAL_APP_ID,
      headings: { es: 'Aviso de Latina Live' },
      contents: { es: message.trim() },
      // Filtrado por tag (como lo etiquetas en el cliente con OneSignal.User.addTags)
      filters: [
        {
          field: 'tag',
          key: 'locutor_uid',
          relation: '=',
          value: locutorId.trim()
        }
      ]
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(bodyPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      // OneSignal suele devolver { errors: [...] } o un objeto con detalles
      console.error('[ERROR][OneSignal]', data);
      const msg =
        Array.isArray(data?.errors) ? data.errors.join(', ')
        : typeof data?.errors === 'string' ? data.errors
        : data?.error || 'Error desconocido de OneSignal';
      throw new Error(msg);
    }

    res.status(200).json({ success: true, message: 'Notificación enviada a través de OneSignal.' });
  } catch (error) {
    console.error('[ERROR FATAL][OneSignal]', error);
    res.status(500).json({ error: `Fallo al enviar la notificación: ${error.message}` });
  }
});

// ==========================================================
// INICIAR EL SERVIDOR
// ==========================================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
