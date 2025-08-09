// server.js

// 1. Importar herramientas (las que ya tenías + las nuevas)
const express = require('express');
const path = require('path');
const admin = require('firebase-admin'); // <-- NUEVO: SDK de Admin de Firebase
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================================
// INICIALIZACIÓN DE FIREBASE ADMIN (SOLO PARA EL BACKEND)
// ==========================================================
try {
  // Leemos las credenciales desde la variable de entorno que configuraste en Render
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('[LOG] Firebase Admin SDK inicializado correctamente.');
} catch (error) {
  console.error('[ERROR FATAL][Firebase Admin] No se pudo inicializar el SDK. Verifica la variable de entorno FIREBASE_SERVICE_ACCOUNT.', error.message);
}


// 2. Middlewares (los que ya tenías + uno nuevo)
// Servir archivos estáticos (tu web construida por Eleventy)
app.use(express.static(path.join(__dirname, '_site')));
// Middleware para que Express entienda peticiones con cuerpo JSON (necesario para la nueva API)
app.use(express.json()); // <-- NUEVO


// ==========================================================
// ENDPOINT DE API PARA SPOTIFY (SIN CAMBIOS)
// ==========================================================
app.get('/api/spotify-releases', async (req, res) => {
  // ... tu código de Spotify, intacto ...
  console.log('[LOG] Petición recibida en /api/spotify-releases');
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[ERROR][Spotify] Claves de API no configuradas en las variables de entorno.");
    return res.status(500).json({ error: 'Configuración de Spotify incompleta.' });
  }
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64') }, body: 'grant_type=client_credentials' });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(`Error de autenticación con Spotify: ${tokenData.error_description || 'Credenciales inválidas'}`);
    const accessToken = tokenData.access_token;
    const releasesResponse = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', { headers: { 'Authorization': 'Bearer ' + accessToken } });
    const releasesData = await releasesResponse.json();
    if (!releasesResponse.ok) throw new Error(`Error al obtener lanzamientos de Spotify: ${releasesData.error?.message || 'Respuesta inesperada'}`);
    res.status(200).json(releasesData.albums.items);
  } catch (error) {
    console.error('[ERROR FATAL][Spotify]', error.message);
    res.status(500).json({ error: 'Fallo al obtener los lanzamientos de Spotify.' });
  }
});


// ==========================================================
// ENDPOINTS DE API PARA PEDIDOS DE AZURACAST (SIN CAMBIOS)
// ==========================================================
app.get('/api/get-request-list/:stationId', async (req, res) => {
    // ... tu código de AzuraCast, intacto ...
    const stationId = req.params.stationId;
    const azuracastUrl = process.env.AZURACAST_URL;
    const apiKey = process.env.AZURACAST_API_KEY;
    if (!stationId || !azuracastUrl || !apiKey) return res.status(500).json({ error: 'Configuración de AzuraCast incompleta.' });
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
    // ... tu código de AzuraCast, intacto ...
    const { stationId, requestId } = req.params;
    const azuracastUrl = process.env.AZURACAST_URL;
    const apiKey = process.env.AZURACAST_API_KEY;
    if (!stationId || !requestId || !azuracastUrl || !apiKey) return res.status(500).json({ error: 'Faltan parámetros.' });
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
// NUEVO ENDPOINT PARA ENVIAR NOTIFICACIONES PUSH
// ==========================================================
app.post('/api/send-notification', async (req, res) => {
  // Obtenemos el título y el cuerpo del mensaje que nos envía el panel de locutores
  const { title, body } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: 'El título y el cuerpo de la notificación son obligatorios.' });
  }

  try {
    // 1. Obtenemos la lista de "direcciones postales" (tokens) de nuestra base de datos
    const db = admin.firestore();
    const subscriptionsSnapshot = await db.collection('subscriptions').get();
    
    if (subscriptionsSnapshot.empty) {
      console.log('[LOG] No hay locutores suscritos a las notificaciones.');
      return res.status(200).json({ success: true, message: 'No hay locutores suscritos para notificar.' });
    }
    
    const tokens = subscriptionsSnapshot.docs.map(doc => doc.id);

    // 2. Preparamos el mensaje que vamos a enviar
    const message = {
      notification: { title, body },
      tokens: tokens, // La lista de destinatarios
    };

    // 3. Le damos la orden al "cartero" (Firebase Cloud Messaging) de enviar el mensaje
    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`[LOG] Notificaciones enviadas. Éxito: ${response.successCount}, Fallo: ${response.failureCount}`);
    
    res.status(200).json({ success: true, message: `Notificación enviada a ${response.successCount} dispositivo(s).` });

  } catch (error) {
    console.error('[ERROR FATAL][FCM]', error);
    res.status(500).json({ error: 'Fallo al enviar la notificación push.' });
  }
});


// ==========================================================
// INICIAR EL SERVIDOR (SIN CAMBIOS)
// ==========================================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});