// server.js

// 1. Importar las herramientas que necesitamos
const express = require('express');
const path = require('path');
const app = express();

// 2. Definir el puerto. Render nos dará un puerto, si no, usamos el 3000.
const PORT = process.env.PORT || 3000;

// 3. Servir los archivos estáticos.
// Esta línea le dice a Express: "Cualquier petición que llegue, primero busca
// si hay un archivo correspondiente en la carpeta '_site'".
// Esto hace que tu index.html, CSS, JS e imágenes se sirvan automáticamente.
app.use(express.static(path.join(__dirname, '_site')));

// 4. ¡NUESTRO ENDPOINT DE API!
// Aquí movemos la lógica de Spotify.
app.get('/api/spotify-releases', async (req, res) => {
  console.log('Petición recibida en /api/spotify-releases');
  
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  // Verificamos si las claves existen. Esto nos ayudará a depurar.
  if (!clientId || !clientSecret) {
    console.error("Claves de Spotify no encontradas en las variables de entorno.");
    return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
  }

  try {
    // --- Lógica de Spotify (la misma que antes) ---
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokenData.error_description);

    const releasesResponse = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', {
      headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
    });

    const releasesData = await releasesResponse.json();
    if (!releasesResponse.ok) throw new Error(releasesData.error.message);

    // Enviamos la respuesta exitosa
    res.status(200).json(releasesData.albums.items);

  } catch (error) {
    // Si algo falla, lo registramos y enviamos un error claro.
    console.error('Error en el endpoint de la API de Spotify:', error.message);
    res.status(500).json({ error: 'Fallo al obtener los lanzamientos de Spotify.' });
  }
});

// 5. Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});