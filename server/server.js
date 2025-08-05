import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import bodyParser from 'body-parser';

// --- Importación correcta de un JSON en ES Modules ---
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./firebase-admin-sdk.json');
// ---------------------------------------------------

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Servir la página del administrador
app.use(express.static('.'));

app.post('/send', async (req, res) => {
  // Ahora esperamos recibir 'topic', 'title' y 'body'
  const { topic, title, body } = req.body;

  if (!topic || !title || !body) {
    return res.status(400).send({ error: 'Faltan los campos topic, title o body.' });
  }

  try {
    const message = {
      notification: { title, body },
      topic: topic // Usamos 'topic' en lugar de 'token'
    };

    // Enviamos el mensaje al tema especificado
    const response = await admin.messaging().send(message);
    console.log('Notificación enviada con éxito:', response);
    res.status(200).send({ success: true, messageId: response });

  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).send({ error: 'Error enviando notificación', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});