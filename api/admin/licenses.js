const LicenseDB = require('../../lib/db');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await LicenseDB.initializeTables();

    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const licenses = await LicenseDB.getAllLicenses(50);

    res.json({
      success: true,
      licenses: licenses.map(license => ({
        ...license,
        metadata: license.metadata || {}
      }))
    });

  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching licenses.',
      error: error.message
    });
  }
};
