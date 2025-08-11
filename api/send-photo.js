const fs = require('fs');
const { IncomingForm } = require('formidable'); // v2 compatible con require
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const MAX_FILE_MB = parseInt(process.env.MAX_FILE_MB || '5', 10);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: MAX_FILE_MB * 1024 * 1024,
  });

  let fields, files;
  try {
    ({ fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })));
    }));
  } catch (err) {
    const msg = String(err?.message || '').includes('maxFileSize')
      ? `La imagen supera ${MAX_FILE_MB} MB.`
      : 'No se pudo procesar el formulario.';
    return res.status(400).json({ error: msg });
  }

  const file = files.photo ? (Array.isArray(files.photo) ? files.photo[0] : files.photo) : null;
  if (!file) return res.status(400).json({ error: 'Falta el archivo "photo".' });

  const mimetype = file.mimetype || file.type || '';
  if (!mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen.' });
  }

  let buffer;
  try {
    buffer = fs.readFileSync(file.filepath || file.path);
  } catch {
    return res.status(500).json({ error: 'No se pudo leer la imagen.' });
  }

  const base64 = buffer.toString('base64');
  const filename = file.originalFilename || file.newFilename || 'foto.jpg';

  const to = process.env.DEST_EMAIL;          // A dónde llega
  const from = process.env.SMTP_FROM;         // Remitente verificado en SendGrid
  const fromEmail = fields.email && String(fields.email);
  const message = fields.message && String(fields.message);

  try {
    await sgMail.send({
      to,
      from,
      subject: `Nueva foto${fromEmail ? ' de ' + fromEmail : ''}`,
      text: message || 'Sin mensaje.',
      attachments: [
        { content: base64, filename, type: mimetype, disposition: 'attachment' }
      ],
      replyTo: fromEmail || undefined,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('SG ERROR:', err?.response?.body || err?.message || err);
    return res.status(500).json({ error: 'No se pudo enviar el correo.' });
  } finally {
    try { if (file.filepath) fs.unlinkSync(file.filepath); } catch {}
  }
};
