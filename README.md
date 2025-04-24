# Latina Live

¡Bienvenido a Latina Live! Este es un sitio web de radio en línea con una mezcla vibrante de música latina.

## Estructura del proyecto

```
latina_live_site/
│
├── index.html       # Página principal del sitio
├── styles.css       # Estilos CSS
└── README.md        # Instrucciones de despliegue
```

## Cómo desplegar en Render.com

1. **Crea un repositorio en GitHub:**
   - Ve a [github.com](https://github.com) y crea un nuevo repositorio.
   - Asigna un nombre como `latina-live-site`.
   - No marques la opción de README (ya lo tienes aquí).

2. **Sube los archivos:**
   - Clona tu repositorio:
     ```
     git clone https://github.com/TU_USUARIO/latina-live-site.git
     ```
   - Copia los archivos `index.html`, `styles.css` y `README.md` al repositorio local.
   - Desde la terminal, realiza:
     ```
     git add .
     git commit -m "Primer commit - Sitio Latina Live"
     git push origin main
     ```

3. **Despliega en Render:**
   - Ve a [Render.com](https://render.com) y crea una cuenta si no la tienes.
   - Clic en "New" → "Static Site".
   - Conecta tu cuenta de GitHub y selecciona el repositorio que creaste.
   - Configura los siguientes parámetros:
     - **Name**: latina-live
     - **Build Command**: *(déjalo vacío)*
     - **Publish Directory**: `.`

   - Haz clic en **Create Static Site** y Render se encargará del resto.

¡Y listo! Tu sitio estará en línea y podrás compartir la URL pública generada por Render.
