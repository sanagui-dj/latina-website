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
// ENDPOINT DE API PARA SPOTIFY (México + Worldwide)
// ==========================================================
app.get('/api/spotify-releases', async (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Configuración de Spotify incompleta.' });
  }

  try {
    // 1️⃣ Obtener token
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

    // 2️⃣ Función para obtener lanzamientos por país
    const fetchReleases = async (country) => {
      const response = await fetch(`https://api.spotify.com/v1/browse/new-releases?country=${country}&limit=10`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
      const data = await response.json();
      return data.albums.items.map(album => ({
        title: album.name,
        artist: album.artists.map(a => a.name).join(', '),
        release_date: album.release_date,
        url: album.external_urls.spotify,
        country
      }));
    };

    // 3️⃣ Obtener lanzamientos para México y Worldwide
    const [mxReleases, wwReleases] = await Promise.all([
      fetchReleases('MX'),
      fetchReleases('US') // proxy Worldwide
    ]);

    const allReleases = [...mxReleases, ...wwReleases];

    // 🔹 Anti-cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.status(200).json(allReleases);

  } catch (error) {
    console.error('[ERROR FATAL][Spotify]', error.message);
    res.status(500).json({ error: 'Fallo al obtener los lanzamientos de Spotify.' });
  }
});

// ==========================================================
// INICIAR EL SERVIDOR
// ==========================================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
