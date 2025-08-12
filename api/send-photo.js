// api/send-photo.js
const fs = require('fs');
const formidable = require('formidable');
const sgMail = require('@sendgrid/mail');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const MAX_MB = Number(process.env.MAX_FILE_MB || 5);
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      maxFileSize: MAX_MB * 1024 * 1024,
      allowEmptyFiles: true, // si el input llega vacío, no falla
    });

    const { fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })))
    );

    // Campos
    const to = process.env.DEST_EMAIL;
    const from = process.env.SMTP_FROM;
    const email =
      Array.isArray(fields.email) ? fields.email[0] : (fields.email || '').toString();
    const text =
      Array.isArray(fields.message) ? fields.message[0] : (fields.message || '').toString();

    // Foto OPCIONAL
    let file = files.photo ? (Array.isArray(files.photo) ? files.photo[0] : files.photo) : null;

    const isEmpty =
      !file ||
      file.size === 0 ||
      file.originalFilename === '' ||
      (!file.filepath && !file.path);

    let attachments = [];
    if (!isEmpty) {
      const mimetype = file.mimetype || file.type || '';
      let isImg = mimetype.startsWith && mimetype.startsWith('image/');
      if (!isImg) {
        const name = (file.originalFilename || '').toLowerCase();
        isImg = name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp');
        if (!isImg) return res.status(400).json({ error: 'El archivo debe ser una imagen.' });
      }

      let buffer;
      try {
        buffer = fs.readFileSync(file.filepath || file.path);
      } catch {
        return res.status(500).json({ error: 'No se pudo leer la imagen.' });
      }

      attachments.push({
        content: buffer.toString('base64'),
        filename: file.originalFilename || file.newFilename || 'foto.jpg',
        type: mimetype || 'application/octet-stream',
        disposition: 'attachment',
      });
    }

    // ✅ DRY RUN (prueba sin enviar)
    if (process.env.DRY_RUN === 'true') {
      return res.status(200).json({
        ok: true,
        dryRun: true,
        to, from,
        msgLen: text.length,
        replyTo: email || null,
        hasAttachment: !!attachments.length,
        attName: attachments[0]?.filename || null,
      });
    }

    // Envío real con SendGrid
    const key = process.env.SENDGRID_API_KEY || '';
    if (!key.startsWith('SG.')) {
      console.error('API key inválida o no configurada');
      return res.status(400).json({ error: 'Configura una SENDGRID_API_KEY válida.' });
    }
    sgMail.setApiKey(key);

    const msg = {
      to,
      from, // debe ser un sender verificado en SendGrid
      subject: 'Formulario (foto opcional)',
      text: (text || 'Sin mensaje') + (email ? `\n\nRemitente: ${email}` : ''),
      attachments: attachments.length ? attachments : undefined,
      ...(email ? { replyTo: email } : {}),
    };

    await sgMail.send(msg);
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Log útil para ver en Runtime Logs de Vercel
    console.error('SG ERROR:', err.response?.body || err.message || err);
    return res.status(500).json({ error: 'No se pudo enviar el correo.' });
  }
};
