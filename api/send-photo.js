// Foto OPCIONAL (tratar input vacío como "sin archivo")
let file = files.photo ? (Array.isArray(files.photo) ? files.photo[0] : files.photo) : null;

// Detectar campo de archivo vacío (sin selección real)
const empty =
  !file ||
  file.size === 0 ||
  file.originalFilename === '' ||
  (!file.filepath && !file.path);

let attachments = [];
if (!empty) {
  const mimetype = file.mimetype || file.type || '';
  // Si mimetype viene vacío, intenta inferir por nombre; si no es imagen, error
  let isImg = !!mimetype && mimetype.startsWith('image/');
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
// si `attachments` queda vacío, se enviará el correo sin adjunto (OK)
