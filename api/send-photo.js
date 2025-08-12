module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // No parseamos nada, solo confirmamos que llegamos aquí:
    return res.status(200).json({
      ok: true,
      msg: 'stub ok',
      contentType: req.headers['content-type'] || null,
    });
  } catch (err) {
    console.error('STUB ERROR:', err);
    return res.status(500).json({ error: 'stub failed' });
  }
};
