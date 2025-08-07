// server.js (Versión de Depuración)

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '_site')));

// ... (El endpoint de Spotify se queda igual) ...
app.get('/api/spotify-releases', async (req, res) => { /* ... */ });


// === ENDPOINT DE AZURACAST CON DEPURACIÓN ===

app.get('/api/get-request-list/:stationId', async (req, res) => {
  const stationId = req.params.stationId;
  console.log(`[LOG] Petición recibida para la estación ID: ${stationId}`);

  const azuracastUrl = process.env.AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;

  // 1. Verificamos si las variables de entorno se están leyendo bien
  console.log(`[LOG] URL de AzuraCast: ${azuracastUrl}`);
  // Mostramos solo una parte de la API Key por seguridad en los logs
  console.log(`[LOG] API Key encontrada: ${apiKey ? 'Sí, empieza con ' + apiKey.substring(0, 4) + '...' : 'No, no encontrada'}`);

  if (!stationId || !azuracastUrl || !apiKey) {
    console.error("[ERROR] Configuración del servidor incompleta. Faltan variables de entorno.");
    return res.status(500).json({ error: 'Configuración del servidor de AzuraCast incompleta.' });
  }

  const apiEndpoint = `${azuracastUrl}/api/station/${stationId}/requests`;
  console.log(`[LOG] Construyendo petición a: ${apiEndpoint}`);

  try {
    const response = await fetch(apiEndpoint, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    console.log(`[LOG] Respuesta de AzuraCast recibida con código de estado: ${response.status}`);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] AzuraCast devolvió un error: ${response.status}. Respuesta: ${errorText}`);
        throw new Error(`No se pudo obtener la lista de canciones. Código: ${response.status}`);
    }
    
    // 2. Vemos la respuesta cruda antes de convertirla a JSON
    const responseText = await response.text();
    console.log('[LOG] Respuesta de AzuraCast (texto crudo):', responseText.substring(0, 200) + '...'); // Mostramos los primeros 200 caracteres

    // 3. Intentamos convertir la respuesta a JSON
    const data = JSON.parse(responseText);
    
    console.log(`[LOG] Respuesta JSON procesada. Se encontraron ${data.length} canciones en total.`);
    
    // Devolvemos la respuesta al navegador
    res.status(200).json(data);

  } catch (error) {
    console.error('[ERROR FATAL] Fallo en el bloque try/catch de get-request-list:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ... (El endpoint POST y el app.listen se quedan igual) ...
app.post('/api/send-song-request/:stationId/:requestId', async (req, res) => { /* ... */ });

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});