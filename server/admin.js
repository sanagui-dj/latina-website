document.getElementById("notif-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Obtenemos también el valor del campo 'topic'
  const topic = document.getElementById("topic").value.trim();
  const title = document.getElementById("title").value.trim();
  const body = document.getElementById("body").value.trim();

  const statusDiv = document.getElementById("status");
  statusDiv.textContent = "Enviando...";

  try {
    const response = await fetch("http://localhost:3000/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // Enviamos el 'topic' junto con el título y el cuerpo
      body: JSON.stringify({ topic, title, body })
    });

    const result = await response.json();

    if (response.ok) {
      statusDiv.textContent = `✅ Notificación enviada correctamente a '${topic}'.`;
    } else {
      statusDiv.textContent = `❌ Error: ${result.error || 'No se pudo enviar'}`;
    }
  } catch (error) {
    statusDiv.textContent = `❌ Error de red: ${error.message}`;
  }
});