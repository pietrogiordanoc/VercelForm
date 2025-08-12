# Formulario con imagen **opcional**

- Frontend: `index.html` (la imagen **no es obligatoria**).
- Backend: `/api/send-photo` con **SendGrid API** (sin SMTP).

## Variables en Vercel
- `SENDGRID_API_KEY` — tu API key (SG...)
- `SMTP_FROM` — remitente verificado en SendGrid (ej: `tu@correo.com`)
- `DEST_EMAIL` — correo destino
- (opcional) `MAX_FILE_MB` — 5 por defecto

## Prueba
- GET `/api/send-photo` → 405 (ok)
- POST formulario con/sin imagen → correo con o sin adjunto
