const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // npm i node-fetch@2
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔹 Middleware para desactivar caché en TODAS las respuestas
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, '_site')));

// ==========================================================
// ENDPOINT DE API PARA SPOTIFY (SIN CAMBIOS DE LÓGICA)
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
    if (!tokenResponse.ok) throw new Error(`Auth Spotify: ${tokenData.error_description || 'Credenciales inválidas'}`);

    const accessToken = tokenData.access_token;
    const releasesResponse = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    const releasesData = await releasesResponse.json();
    if (!releasesResponse.ok) throw new Error(`API Spotify: ${releasesData.error?.message || 'Respuesta inesperada'}`);

    // 🔹 Desactivar caché para este endpoint en particular (extra)
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.status(200).json(releasesData.albums.items);

  } catch (error) {
    console.error('[ERROR FATAL][Spotify]', error.message);
    res.status(500).json({ error: 'Fallo al obtener los lanzamientos de Spotify.' });
  }
});

// ==========================================================
// ENDPOINT PARA ENVIAR NOTIFICACIONES PUSH CON FIREBASE
// ==========================================================
app.post('/api/send-notification', async (req, res) => {
  const { title, body, tokens } = req.body;
  const { FIREBASE_SERVER_KEY } = process.env;

  if (!title || !body) {
    return res.status(400).json({ error: 'Título y cuerpo son obligatorios.' });
  }

  if (!Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un token de dispositivo.' });
  }

  if (!FIREBASE_SERVER_KEY) {
    return res.status(500).json({ error: 'Falta FIREBASE_SERVER_KEY en variables de entorno.' });
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`
      },
      body: JSON.stringify({
        registration_ids: tokens,
        notification: {
          title,
          body,
          icon: '/icon.png',
          click_action: 'https://latina.ahmrs.net'
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[ERROR][Firebase]', data);
      throw new Error(JSON.stringify(data));
    }

    res.status(200).json({ success: true, firebaseResponse: data });

  } catch (error) {
    console.error('[ERROR FATAL][Firebase]', error);
    res.status(500).json({ error: `Fallo al enviar la notificación: ${error.message}` });
  }
});

// ==========================================================
// INICIAR EL SERVIDOR
// ==========================================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
