import LicenseDB from '../../lib/db';

export default async function handler(req, res) {
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

    return res.status(200).json({
      success: true,
      licenses: licenses.map(license => ({
        ...license,
        metadata: license.metadata || {}
      }))
    });

  } catch (error) {
    console.error('Error fetching licenses:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching licenses.',
      error: error.message
    });
  }
}
