/**
 * 14.js - Lógica para la experiencia "14 Fragmentos"
 * Maneja la cuenta regresiva, la reproducción de audio y la navegación de mensajes.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const startBtn = document.getElementById('start-btn');
    const favBtn = document.getElementById('fav-btn');
    const nextBtn = document.getElementById('next-btn');
    const finalBtn = document.getElementById('final-redirect-btn'); // Botón final si existe o se crea dinámicamente

    // Inicialización de Event Listeners
    if (startBtn) startBtn.addEventListener('click', iniciarExperiencia);
    if (favBtn) favBtn.addEventListener('click', marcarFavorito);
    if (nextBtn) nextBtn.addEventListener('click', mostrarSiguienteMensaje);
    if (finalBtn) finalBtn.addEventListener('click', () => window.location.href = 'carta.html');
});

// Estado de la aplicación
let indiceActual = 0;
let mensajeFavorito = null;
let listaMensajes = []; // Se cargará dinámicamente
const audio = document.getElementById('music');
const announcer = document.getElementById('announcer');

// Cargar mensajes desde JSON al iniciar
fetch('mensajes.json')
    .then(response => response.json())
    .then(data => {
        listaMensajes = data;
        console.log("Mensajes cargados:", listaMensajes.length);
    })
    .catch(error => {
        console.error("Error al cargar mensajes:", error);
        // Fallback para ejecución local (donde fetch falla por CORS)
        listaMensajes = [
            { "a": "mi ale ❤️", "m": "Me encanta lo que tenemos y me hace feliz que sigas prefiriendo quedarte aquí. Gracias por dejarme compartir esto con la persona que amo.", "p": "P.D. Como me gustaría estar cerca para cuidarte y abrazarte." },
            { "a": "Amor 😘", "m": "Tenerte a mi lado me transmite una tranquilidad que no sé poner en palabras. Gracias por cuidarme, nunca me había sentido tan cuidada.", "p": "" },
            { "a": "Amor 😘", "m": "Gracias por ser tú quien me hace feliz con solo un mensaje o una llamada. Estoy deseando que se me vaya esta gripe para fastidiarte la vida.", "p": "" },
            { "a": "Amor 😘", "m": "Me encanta cerrar mi día con la persona que más amo. Me encantas.", "p": "" },
            { "a": "Amor 😘", "m": "Despertar contigo definitivamente es de mis cosas favoritas. Elegí a la persona correcta para pasar el resto de mis días.", "p": "" },
            { "a": "mi ale ❤️", "m": "Qué buen sábado me regaló la vida al despertarme contigo. Gracias por ser esa persona que me da paz mental.", "p": "P.D. Hoy me urge quitarte la paz respiratoria..." },
            { "a": "Amor 😘", "m": "Me encanta compartir todo de mí contigo. Que me veas de niñera me gusta porque ves una parte de mi día que no se da tanto.", "p": "" },
            { "a": "mi ale ❤️", "m": "Eres alguien a quien quiero en mi vida siempre. Quiero hacerte feliz y darte lo que mereces.", "p": "P.D. El acertijo de la carta era un 69... de nada." },
            { "a": "mi ale ❤️", "m": "Saber que puedo hablar de lo que siento sin miedo me pone una sonrisa en la cara. Nuestra comunicación es lo mejor que tenemos.", "p": "P.D. Lo que más me urge es que tú mantengas la postura que te voy a pedir hoy..." },
            { "a": "Amor 😘", "m": "Gracias por esa forma tan tuya e incondicional de amarme. Me habría encantado mimir contigo, pronto lo haremos sin un celular de por medio.", "p": "" },
            { "a": "mi ale ❤️", "m": "Cada que te escucho me pregunto qué hice para merecer a alguien como tú. Cuanto más pasa el tiempo, más me llenas de paz.", "p": "P.D. Mi 'conferencia' va a ser en la cama y va a durar mucho más de dos horas." },
            { "a": "Amor 😘", "m": "Extrañaba mucho dormir contigo, pero la pura verdad, te extrañaba a ti. Me encantó escucharte.", "p": "" },
            { "a": "mi ale ❤️", "m": "Gracias por estar y amarme. Me ayudaste a transmitirle fortaleza a mi papá y te agradezco por eso y por todo.", "p": "" },
            { "a": "Nuestro Destino", "m": "Por todos los mensajes que vendrán y por el 12 de julio que ya casi tocamos con los dedos.", "p": "Te amo." }
        ];
    });

/**
 * Anuncia texto a lectores de pantalla
 * @param {string} texto - Texto a anunciar
 */
function anunciar(texto) {
    if (!announcer) return;
    announcer.textContent = "";
    setTimeout(() => { announcer.textContent = texto; }, 100);
}

/**
 * Inicia la secuencia de temporizador
 */
function iniciarExperiencia() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('timer-screen').classList.remove('hidden');

    let tiempo = 11;
    const timerDisplay = document.getElementById('timer-display');
    anunciar("Iniciando cuenta regresiva desde 11");

    const timerInterval = setInterval(() => {
        tiempo--;

        // Si ya se detuvo el intervalo externamente (en programarImpacto), no seguir
        if (tiempo < 0) {
            clearInterval(timerInterval);
            return;
        }

        if (timerDisplay) timerDisplay.textContent = tiempo;
        anunciar(tiempo.toString());

        if (tiempo === 9) {
            iniciarAudio();
            programarImpacto(timerInterval); // Pasamos el ID del intervalo para detenerlo
        }

        if (navigator.vibrate) navigator.vibrate(60);

        if (tiempo <= 0) {
            clearInterval(timerInterval);
        }
    }, 1071); // Sincronizado a ~112 BPM
}

function iniciarAudio() {
    if (audio) {
        audio.volume = 0.2;
        audio.play().catch(e => console.log("Reproducción automática bloqueada por el navegador, se requiere interacción usuario previa.", e));
    }
}

/**
 * Efecto visual y transición al tarro de mensajes
 * @param {number} intervalId - ID del intervalo para detener la cuenta
 */
function programarImpacto(intervalId) {
    // 8.649 segundos del drop musical calculado
    setTimeout(() => {
        // DETENER LA CUENTA AQUÍ -> Evita que llegue a 0 o números negativos
        if (intervalId) clearInterval(intervalId);

        // Mostrar bienvenida visual
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = "❤️"; // O "¡Bienvenida, mi amor!"
            anunciar("Bienvenido");
        }

        document.body.style.backgroundColor = "white";
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        // Retraso de 2.5 segundos para apreciar el corazón y la música antes de mostrar texto
        setTimeout(() => {
            document.body.style.backgroundColor = ""; // Volver al color definido en CSS
            mostrarTarro();
        }, 2500);
    }, 8649);
}

function mostrarTarro() {
    document.getElementById('timer-screen').classList.add('hidden');
    document.getElementById('jar-screen').classList.remove('hidden');
    mostrarSiguienteMensaje();
}

/**
 * Muestra el siguiente mensaje con transición suave
 */
function mostrarSiguienteMensaje() {
    if (indiceActual < listaMensajes.length) {
        const contenedor = document.querySelector('.message-box');

        // Iniciar Fade Out
        if (contenedor) contenedor.classList.add('hidden-fade');

        // Esperar a que termine la transición (500ms definidos en CSS)
        setTimeout(() => {
            const item = listaMensajes[indiceActual];

            // Bajar volumen momentáneamente
            if (audio) audio.volume = 0.05;

            // Actualizar DOM
            document.getElementById('author-tag').textContent = `DE: ${item.a}`;
            document.getElementById('text-body').textContent = `"${item.m}"`;
            document.getElementById('ps-body').textContent = item.p || "";

            // Fade In
            if (contenedor) contenedor.classList.remove('hidden-fade');

            // Lectura accesible
            const textoVoz = `Mensaje de ${item.a}. ${item.m}. ${item.p ? 'Posdata: ' + item.p : ''}`;
            anunciar(textoVoz);

            // Resetear botón de favorito
            const favBtn = document.getElementById('fav-btn');
            if (favBtn) {
                favBtn.textContent = "📍 Guardar como favorito";
                favBtn.className = "btn-success";
                favBtn.classList.remove('saved');
            }

            indiceActual++;

            const nextBtn = document.getElementById('next-btn');
            if (indiceActual === listaMensajes.length && nextBtn) {
                nextBtn.textContent = "Ver destino final";
            }

            // Restaurar volumen
            setTimeout(() => {
                if (audio && audio.volume < 0.2) audio.volume = 0.2;
            }, 5000);

        }, 500); // 500ms de espera para la transición

    } else {
        mostrarFinal();
    }
}

function marcarFavorito() {
    if (indiceActual > 0) {
        mensajeFavorito = listaMensajes[indiceActual - 1];
        const btn = document.getElementById('fav-btn');
        if (btn) {
            btn.textContent = "❤️ GUARDADO";
            btn.classList.add('saved'); // Para estilos CSS si se desea
            // Mantener estilo inline para compatibilidad visual exacta con original si CSS no cubre todo
            btn.style.background = "var(--accent-color)";
        }
        anunciar("Has guardado este deseo en tu muro de favoritos.");
        if (navigator.vibrate) navigator.vibrate(100);
    }
}

function mostrarFinal() {
    document.getElementById('jar-screen').classList.add('hidden');
    document.getElementById('final-screen').classList.remove('hidden');

    if (mensajeFavorito) {
        const favReview = document.getElementById('fav-review');
        if (favReview) favReview.textContent = `Tu deseo favorito: "${mensajeFavorito.m}"`;
        anunciar("Llegamos al final. Tu deseo favorito fue: " + mensajeFavorito.m);
    }

    iniciarCuentaFinal();
}

function iniciarCuentaFinal() {
    const target = new Date('July 12, 2026 00:00:00').getTime();
    const countdownEl = document.getElementById('countdown');

    if (!countdownEl) return;

    setInterval(() => {
        const now = new Date().getTime();
        const diff = target - now;

        if (diff < 0) {
            countdownEl.textContent = "¡Ha llegado el día!";
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
    }, 1000);
}
