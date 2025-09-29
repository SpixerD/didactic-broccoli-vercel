import LicenseDB from '../lib/db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await LicenseDB.initializeTables();

    const { licenseKey, fingerprint, extensionVersion } = req.body;
    const ipAddress =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      'unknown';
    const userAgent = req.headers['user-agent'];

    if (!licenseKey || !fingerprint) {
      return res.status(400).json({
        success: false,
        message: 'Clé de License et empreinte digitale nécessaire.'
      });
    }
      
    if (!license) {
      return res.status(200).json({
        success: false,
        message: 'Clé de License invalide.'
      });
    }

    if (license.status !== 'active') {
      return res.status(200).json({
        success: false,
        message: 'Licence non activée.'
      });
    }

    if (LicenseDB.isLicenseExpired(license.expires_at)) {
      return res.status(200).json({
        success: false,
        message: 'License expirée.'
      });
    }

    if (license.fingerprint && license.fingerprint !== fingerprint) {
      return res.status(200).json({
        success: false,
        message: 'License est déja activé pour une autre machine.'
      });
    }

    if (
      license.activation_count >= license.max_activations &&
      !license.fingerprint
    ) {
      return res.status(200).json({
        success: false,
        message: 'Licence activé plusieurs fois.'
      });
    }

    await LicenseDB.updateLicenseFingerprint(licenseKey, fingerprint);
    await LicenseDB.recordActivation(
      licenseKey,
      fingerprint,
      ipAddress,
      userAgent
    );

    const metadata = license.metadata || {};

    return res.status(200).json({
      success: true,
      message: 'Licence activée avec succès.',
      expires: license.expires_at,
      isTrial: metadata.isTrial || false
    });

  } catch (error) {
    console.error('Activation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur de serveur pendant l'activation.'
    });
  }
}
