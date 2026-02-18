const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const multer = require('multer');

// Asegurar que la carpeta de subidas existe para evitar errores al grabar
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const upload = multer({ dest: 'uploads/' });
const app = express();

// Configuración de CORS amplia para permitir peticiones desde tu web
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURACIÓN GENERAL ---
const TELEGRAM_TOKEN = '8550797324:AAEJJiAJsQtyf0esaLIh7vGp5zi1xW3WlHs';
const DESTINATARIOS = ['729756749', '-5103446287'];
const API_AZURACAST = 'https://radios.latinalive.net/api/station/1';

// --- VARIABLES DEL SISTEMA ---
let ultimoLatido = Date.now();
let radioCaida = false;
let ultimaAlertaEnviada = 0;
let locutorAlAire = "Música Automática";
let chatMensajes = [];
let oyentesPicoSersion = 0;
let modoMantenimiento = false;

// 1. EL VIGILANTE (WATCHDOG)
// Sigue activo para monitorear si el script de ping en el VPS sigue vivo
setInterval(() => {
    const ahora = Date.now();
    if (modoMantenimiento) {
        ultimoLatido = ahora;
        return;
    }
    const tiempoSinReporte = ahora - ultimoLatido;
    if (tiempoSinReporte > 65000) {
        radioCaida = true;
        if (ahora - ultimaAlertaEnviada > 120000) {
            enviarAlertaTelegram("🚨 *¡SISTEMA NO RESPONDE!* 🚨\n\nNo se reciben señales del VPS.");
            ultimaAlertaEnviada = ahora;
        }
    }
}, 30000);

// 2. AUTO-PROMO WEB (CADA 15 MINUTOS)
setInterval(() => {
    const mensajes = ["🎸 ¡Pide tu canción!", "📱 ¡Síguenos en redes!", "🎧 Latina Live Online."];
    const msg = {
        usuario: "🤖 Latina Bot",
        mensaje: mensajes[Math.floor(Math.random() * mensajes.length)],
        fecha: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };
    chatMensajes.push(msg);
    if (chatMensajes.length > 20) chatMensajes.shift();
}, 900000);

// 3. WEBHOOK (TELEGRAM)
app.post(['/api/webhook', '/webhook'], async (req, res) => {
    const { message, callback_query } = req.body;

    if (callback_query) {
        const nombreStaff = callback_query.from.first_name;
        if (callback_query.data === 'pedido_atendido') {
            fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: callback_query.message.chat.id,
                    message_id: callback_query.message.message_id,
                    text: `${callback_query.message.text}\n\n✅ *Atendido por:* ${nombreStaff}`,
                    parse_mode: 'Markdown'
                })
            });
        }
        return res.sendStatus(200);
    }

    if (message && message.text) {
        const texto = message.text.toLowerCase();
        const nombre = message.from.first_name || "Locutor";

        if (texto.includes('/mantenimiento')) {
            modoMantenimiento = !modoMantenimiento;
            if (modoMantenimiento) ultimoLatido = Date.now();
            enviarAlertaTelegram(`🔧 *Mantenimiento:* ${modoMantenimiento ? "ACTIVADO 🛠️" : "DESACTIVADO ✅"}`);
        }
        else if (texto.includes('/aire')) {
            locutorAlAire = nombre;
            oyentesPicoSersion = await obtenerOyentesActuales();
            enviarAlertaTelegram(`🎙️ *¡ATENCIÓN!* \n\n*${nombre}* está al aire.`);
        }
        else if (texto.includes('/fuera')) {
            enviarAlertaTelegram(`💤 *Turno Terminado* de ${locutorAlAire}. Pico: ${oyentesPicoSersion}`);
            locutorAlAire = "Música Automática";
            oyentesPicoSersion = 0;
        }
        else if (texto.includes('/clearchat')) {
            chatMensajes = [];
            enviarAlertaTelegram("🧹 Chat web vaciado.");
        }
    }
    res.sendStatus(200);
});

// 4. RUTAS PARA LA WEB CON REDIRECCIÓN
app.post(['/api/pedido', '/pedido'], async (req, res) => {
    const { nombre, mensaje, cancion } = req.body;
    const teclado = { inline_keyboard: [[{ text: "✅ Marcar como Atendido", callback_data: "pedido_atendido" }]] };

    enviarAlertaConTeclado(`🎙️ *PEDIDO*\n👤 *De:* ${nombre || 'Anónimo'}\n🎵 *Canción:* ${cancion || 'N/A'}\n💬 *Mensaje:* ${mensaje || 'Sin mensaje'}`, teclado);

    res.redirect('https://latinalive.net/pedidos?envio=exitoso');
});

app.post('/api/nota-voz', upload.single('audio'), async (req, res) => {
    try {
        const nombre = (req.body && req.body.nombre) ? req.body.nombre : 'Anónimo';

        if (!req.file) {
            return res.redirect('https://latinalive.net/pedidos?envio=error');
        }

        for (const id of DESTINATARIOS) {
            const form = new FormData();
            form.append('chat_id', id);
            form.append('voice', fs.createReadStream(req.file.path));
            form.append('caption', `🎤 *Nota de voz de:* ${nombre}`);

            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVoice`, { method: 'POST', body: form });
        }

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.redirect('https://latinalive.net/pedidos?envio=exitoso');
    } catch (err) {
        console.error("Error en nota-voz:", err);
        res.redirect('https://latinalive.net/pedidos?envio=error');
    }
});

app.post(['/api/enviar-web', '/enviar-web'], (req, res) => {
    const { usuario, mensaje } = req.body;

    if (!mensaje) {
        return res.status(400).send("Mensaje requerido");
    }

    const nuevoMensaje = {
        usuario: usuario || "Anónimo",
        mensaje: mensaje,
        fecha: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };

    chatMensajes.push(nuevoMensaje);

    // Enviar a Telegram
    try {
        await enviarAlertaTelegram(`💬 *CHAT WEB*\n👤 *${nuevoMensaje.usuario}*\n📝 ${nuevoMensaje.mensaje}`);
    } catch (e) {
        console.error("Error enviando a Telegram", e);
    }

    // Mantener solo los últimos 50 mensajes
    if (chatMensajes.length > 50) chatMensajes.shift();

    res.json({ success: true, mensaje: nuevoMensaje });
});

// 5. FUNCIONES DE APOYO
async function obtenerOyentesActuales() {
    try {
        const response = await fetch(API_AZURACAST);
        const data = await response.json();
        return data.listeners.total || 0;
    } catch (e) { return 0; }
}

async function enviarAlertaTelegram(mensaje) {
    for (const id of DESTINATARIOS) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: id, text: mensaje, parse_mode: 'Markdown' })
        });
    }
}

function enviarAlertaConTeclado(mensaje, teclado) {
    DESTINATARIOS.forEach(id => {
        fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: id, text: mensaje, parse_mode: 'Markdown', reply_markup: teclado })
        });
    });
}

app.get(['/api/ping', '/ping'], (req, res) => {
    ultimoLatido = Date.now();
    if (radioCaida) {
        enviarAlertaTelegram("✅ *CONEXIÓN RECUPERADA*");
        radioCaida = false;
        ultimaAlertaEnviada = 0;
    }
    res.send('pong');
});

app.get(['/api/estado', '/estado'], (req, res) => res.json({ locutor: locutorAlAire }));
app.get(['/api/leer-chat', '/leer-chat'], (req, res) => res.json(chatMensajes));

app.listen(3000, () => console.log('Latina Live Server Online (Sin API RB)'));