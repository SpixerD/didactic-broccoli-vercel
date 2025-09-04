import LicenseDB from '../../lib/db';

export default async function handler(req, res) {
  // Handle CORS for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database tables on first request
    await LicenseDB.initializeTables();

    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { expiresAt, maxActivations = 1, metadata = {} } = req.body;
    
    const licenseKey = await LicenseDB.createLicense(
      expiresAt,
      maxActivations,
      metadata
    );
    
    return res.status(200).json({
      success: true,
      licenseKey,
      expiresAt,
      maxActivations,
      metadata
    });

  } catch (error) {
    console.error('License creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating license.',
      error: error.message
    });
  }
}
