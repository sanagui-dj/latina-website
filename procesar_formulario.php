<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = strip_tags(trim($_POST["nombre"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $mensaje = strip_tags(trim($_POST["mensaje"]));

    // Validación adicional (opcional)
    if (empty($nombre) || empty($mensaje) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo "Por favor, completa el formulario correctamente.";
        exit;
    }

    $destinatario = "alexsanagui.00@gmail.com"; // Reemplaza con tu dirección de correo
    $asunto = "Nuevo mensaje de contacto desde Latina Live";
    $cuerpo = "Nombre: $nombre\n";
    $cuerpo .= "Email: $email\n\n";
    $cuerpo .= "Mensaje:\n$mensaje\n";

    $cabeceras = "From: $email\r\n";
    $cabeceras .= "Reply-To: $email\r\n";

    // Envío del correo
    if (mail($destinatario, $asunto, $cuerpo, $cabeceras)) {
        http_response_code(200);
        echo "¡Gracias por tu mensaje! Te responderemos a la brevedad.";
    } else {
        http_response_code(500);
        echo "Hubo un error al enviar tu mensaje. Por favor, inténtalo de nuevo más tarde.";
    }
} else {
    http_response_code(403);
    echo "Hubo un problema con tu envío, por favor inténtalo de nuevo.";
}
?>