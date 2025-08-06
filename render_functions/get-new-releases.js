// render_functions/get-new-releases.js

// Usamos el 'handler' de Netlify/Render, es el formato estándar.
exports.handler = async function(event, context) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  try {
    // --- PASO A: Obtener el token de acceso de Spotify ---
    // Spotify necesita que primero nos autentiquemos como aplicación.
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Codificamos el ID y el Secret en Base64, como pide Spotify.
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // --- PASO B: Pedir los nuevos lanzamientos usando el token ---
    const releasesResponse = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', { // Pedimos los últimos 10
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });

    const releasesData = await releasesResponse.json();
    
    // Devolvemos los datos en un formato que nuestra web pueda usar.
    return {
      statusCode: 200,
      body: JSON.stringify(releasesData.albums.items)
    };

  } catch (error) {
    // Si algo falla, devolvemos un error.
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch new releases' })
    };
  }
};