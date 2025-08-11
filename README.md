# Formulario "Enviar foto al correo"

Proyecto mínimo para **subir una imagen** desde un formulario estático y **enviarla como adjunto por email** usando una **Función Serverless en Vercel** + **Nodemailer (SMTP)**.

## Estructura
```
/
├─ index.html          # Formulario
├─ api/
│  └─ send-photo.js    # Función serverless (Node 18)
├─ package.json
└─ vercel.json
```

## Despliegue rápido (Vercel)
1. Crea un proyecto nuevo en Vercel y sube estos archivos.
2. En **Settings → Environment Variables**, añade:
   - `SMTP_HOST` — ej: smtp.sendgrid.net
   - `SMTP_PORT` — ej: 587
   - `SMTP_SECURE` — `false` si usas 587 (STARTTLS), `true` para 465 (SSL)
   - `SMTP_USER` — usuario SMTP
   - `SMTP_PASS` — contraseña SMTP
   - `SMTP_FROM` — ej: `Formulario <no-reply@tudominio.com>`
   - `DEST_EMAIL` — tu correo destino (donde quieres recibir las fotos)
   - (opcional) `MAX_FILE_MB` — tamaño máximo de imagen (por defecto 5)
3. Haz **Deploy**.

> Recomendado: usar un proveedor como **SendGrid**, **Mailgun**, **Mailjet** o similar. Gmail SMTP suele poner trabas.

## Uso
- Abre la URL del proyecto, selecciona una imagen (PNG/JPG, máx. 5 MB por defecto) y envía.
- El servidor validará tipo y tamaño, y adjuntará el archivo al correo.

## Notas
- Todo se envía desde servidor; no se guarda ninguna imagen.
- Si quieres permitir **varias imágenes**, cambia el input a `multiple` y ajusta la función para recorrer los archivos.
- Si ya usas Next.js, puedes mover esta lógica a `pages/api/send-photo.js` o a un *Route Handler* con `formData()`.
