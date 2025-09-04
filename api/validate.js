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

    if (!licenseKey || !fingerprint) {
      return res.status(400).json({
        valid: false,
        reason: 'missing_parameters'
      });
    }

    const license = await LicenseDB.findLicense(licenseKey);

    if (!license) {
      await LicenseDB.recordValidation(
        licenseKey,
        fingerprint,
        ipAddress,
        'invalid_key'
      );
      return res.status(200).json({
        valid: false,
        reason: 'invalid_license_key'
      });
    }

    if (license.status !== 'active') {
      await LicenseDB.recordValidation(
        licenseKey,
        fingerprint,
        ipAddress,
        'inactive'
      );
      return res.status(200).json({
        valid: false,
        reason: 'license_inactive'
      });
    }

    if (LicenseDB.isLicenseExpired(license.expires_at)) {
      await LicenseDB.recordValidation(
        licenseKey,
        fingerprint,
        ipAddress,
        'expired'
      );
      return res.status(200).json({
        valid: false,
        reason: 'license_expired'
      });
    }

    if (license.fingerprint && license.fingerprint !== fingerprint) {
      await LicenseDB.recordValidation(
        licenseKey,
        fingerprint,
        ipAddress,
        'fingerprint_mismatch'
      );
      return res.status(200).json({
        valid: false,
        reason: 'hardware_mismatch'
      });
    }

    await LicenseDB.recordValidation(
      licenseKey,
      fingerprint,
      ipAddress,
      'valid'
    );

    return res.status(200).json({
      valid: true,
      expires: license.expires_at,
      metadata: license.metadata || {}
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      valid: false,
      reason: 'server_error'
    });
  }
}
