// server.js

// 1. Importar herramientas
const express = require('express');
const path = require('path');
const admin = require('firebase-admin'); // SDK de Admin de Firebase
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Inicialización de Firebase Admin (sin cambios)
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log('[LOG] Firebase Admin SDK inicializado.');
} catch (error) {
  console.error('[ERROR FATAL][Firebase Admin] No se pudo inicializar el SDK.');
}

// 3. Middlewares
app.use(express.json()); // Para entender peticiones con cuerpo JSON

// ==========================================================
// ¡NUEVA RUTA DEDICADA PARA EL SERVICE WORKER!
// Esta ruta intercepta la petición y sirve el archivo con las cabeceras correctas.
// ==========================================================
app.get('/firebase-messaging-sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'firebase-messaging-sw.js'));
});


// 4. Servir el resto de los archivos estáticos de la carpeta _site
// IMPORTANTE: Esta línea va DESPUÉS de la ruta dedicada del Service Worker.
app.use(express.static(path.join(__dirname, '_site')));


// ==========================================================
// ENDPOINT DE API PARA SPOTIFY (SIN NINGÚN CAMBIO)
// ==========================================================
app.get('/api/spotify-releases', async (req, res) => {
  // ... tu código de Spotify, intacto ...
  console.log('[LOG] Petición recibida en /api/spotify-releases');
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
// ENDPOINTS DE API PARA PEDIDOS DE AZURACAST (SIN NINGÚN CAMBIO)
// ==========================================================
app.get('/api/get-request-list/:stationId', async (req, res) => {
    // ... tu código de AzuraCast, intacto ...
    const { stationId } = req.params;
    const { AZURACAST_URL, AZURACAST_API_KEY } = process.env;
    if (!stationId || !AZURACAST_URL || !AZURACAST_API_KEY) return res.status(500).json({ error: 'Configuración de AzuraCast incompleta.' });
    try {
        const apiEndpoint = `${AZURACAST_URL}/api/station/${stationId}/requests`;
        const response = await fetch(apiEndpoint, { headers: { 'Authorization': `Bearer ${AZURACAST_API_KEY}` } });
        if (!response.ok) throw new Error(`Error de AzuraCast: ${response.status}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('[ERROR FATAL][AzuraCast]', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/send-song-request/:stationId/:requestId', async (req, res) => {
    // ... tu código de AzuraCast, intacto ...
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
// ENDPOINT PARA ENVIAR NOTIFICACIONES PUSH (SIN NINGÚN CAMBIO)
// ==========================================================
app.post('/api/send-notification', async (req, res) => {
    // ... tu código de notificaciones, intacto ...
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Título y cuerpo son obligatorios.' });
    try {
        const db = admin.firestore();
        const subscriptionsSnapshot = await db.collection('subscriptions').get();
        if (subscriptionsSnapshot.empty) return res.status(200).json({ success: true, message: 'No hay locutores suscritos.' });
        const tokens = subscriptionsSnapshot.docs.map(doc => doc.id);
        const message = { notification: { title, body }, tokens };
        const response = await admin.messaging().sendMulticast(message);
        res.status(200).json({ success: true, message: `Notificación enviada a ${response.successCount} dispositivo(s).` });
    } catch (error) {
        console.error('[ERROR FATAL][FCM]', error);
        res.status(500).json({ error: 'Fallo al enviar la notificación push.' });
    }
});


// ==========================================================
// INICIAR EL SERVIDOR (SIN NINGÚN CAMBIO)
// ==========================================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});