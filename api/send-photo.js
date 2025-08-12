const fs = require('fs');
const { IncomingForm } = require('formidable');
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

  // Foto OPCIONAL
  const file = files.photo ? (Array.isArray(files.photo) ? files.photo[0] : files.photo) : null;

  let attachments = [];
  if (file) {
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
    attachments.push({
      content: buffer.toString('base64'),
      filename: file.originalFilename || file.newFilename || 'foto.jpg',
      type: mimetype,
      disposition: 'attachment',
    });
  }

  const to = process.env.DEST_EMAIL;
  const from = process.env.SMTP_FROM;
  const fromEmail = fields.email && String(fields.email);
  const message = fields.message && String(fields.message);

  try {
    await sgMail.send({
      to,
      from,
      subject: `Nuevo mensaje${fromEmail ? ' de ' + fromEmail : ''}`,
      text: message || (attachments.length ? 'Sin mensaje.' : 'Sin mensaje ni imagen.'),
      attachments,
      replyTo: fromEmail || undefined,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('SG ERROR:', err?.response?.body || err?.message || err);
    return res.status(500).json({ error: 'No se pudo enviar el correo.' });
  } finally {
    try { if (file?.filepath) fs.unlinkSync(file.filepath); } catch {}
  }
};
