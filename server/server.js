const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');
const serviceAccount = require('./firebase-admin-sdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/send', async (req, res) => {
  const { title, body, token } = req.body;
  try {
    const message = {
      notification: { title, body },
      token
    };
    await admin.messaging().send(message);
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).send({ error: 'Error enviando notificación' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
