// server.js (OneSignal v16 + Identity Verification)

// 1) Imports
const express = require('express');
const path = require('path');
const crypto = require('crypto'); // <-- para firmar el external_id
const app = express();
const PORT = process.env.PORT || 3000;

// 2) Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '_site')));

// Si tu frontend está en OTRO dominio, descomenta CORS y ajusta origin:
// const cors = require('cors');
// app.use(cors({ origin: ['https://latina.ahmrs.net'], methods: ['GET','POST'] }));

// 3) Evitar 404 del favicon
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// =====================================================================
// 4) Endpoint para Spotify (igual que antes; omito por brevedad si no lo usas)
// =====================================================================
app.get('/api/spotify-releases', async (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.status(500).json({ error: 'Configuración de Spotify incompleta.' });

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

    res.status(200).json(releasesData.albums.items);
  } catch (error) {
    console.error('[ERROR FATAL][Spotify]', error.message);
    res.status(500).json({ error: 'Fallo al obtener los lanzamientos de Spotify.' });
  }
});

// =====================================================================
// 5) Endpoint para firmar el external_id de OneSignal (Identity Verification)
// =====================================================================
// Necesitas definir en tu entorno: ONESIGNAL_IDENTITY_VERIFICATION_KEY
// (NO es el REST API Key; es la "Identity Verification Key" del panel)
app.post('/api/onesignal/identity-token', (req, res) => {
  try {
    const { externalId } = req.body;
    const key = process.env.ONESIGNAL_IDENTITY_VERIFICATION_KEY;
    if (!externalId || typeof externalId !== 'string') {
      return res.status(400).json({ error: 'externalId es obligatorio.' });
    }
    if (!key) {
      return res.status(500).json({ error: 'Falta ONESIGNAL_IDENTITY_VERIFICATION_KEY en el servidor.' });
    }
    // token = HMAC-SHA256(externalId, key) en HEX
    const token = crypto.createHmac('sha256', key).update(externalId, 'utf8').digest('hex');
    res.status(200).json({ identityToken: token });
  } catch (err) {
    console.error('[ERROR][IdentityToken]', err);
    res.status(500).json({ error: 'Fallo al generar identityToken' });
  }
});

// =====================================================================
// 6) Endpoint para enviar notificaciones (OneSignal v16 por alias "external_id")
// =====================================================================
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
      target_channel: 'push',
headings: { en: 'Latina Live Notice', es: 'Aviso de Latina Live' },
contents: { en: message.trim(), es: message.trim() },
      include_aliases: {
        external_id: [locutorId.trim()]
      }
      // Para diagnóstico a todos:
      // included_segments: ['Subscribed Users']
      // Para filtrar por tag (menos robusto que alias):
      // filters: [{ field: 'tag', key: 'locutor_uid', relation: '=', value: locutorId.trim() }]
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
      console.error('[ERROR][OneSignal]', data);
      const msg =
        Array.isArray(data?.errors) ? data.errors.join(', ')
        : typeof data?.errors === 'string' ? data.errors
        : data?.error || 'Error desconocido de OneSignal';
      throw new Error(msg);
    }

    res.status(200).json({ success: true, oneSignalResponse: data });
  } catch (error) {
    console.error('[ERROR FATAL][OneSignal]', error);
    res.status(500).json({ error: `Fallo al enviar la notificación: ${error.message}` });
  }
});

// 7) Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
