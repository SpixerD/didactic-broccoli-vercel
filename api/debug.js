module.exports = function handler(req, res) {
  res.status(200).json({ 
    hasApiKey: !!process.env.ADMIN_API_KEY,
    hasDbUrl: !!process.env.DATABASE_URL,
    apiKeyFirst3: process.env.ADMIN_API_KEY?.substring(0, 3),
    dbUrlFirst20: process.env.DATABASE_URL?.substring(0, 20)
  });
};
