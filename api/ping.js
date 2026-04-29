module.exports = function handler(req, res) {
  res.status(200).json({
    ok: true,
    node: process.version,
    env: {
      FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT ? 'set (' + process.env.FIREBASE_SERVICE_ACCOUNT.length + ' chars)' : 'NOT SET',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'NOT SET',
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ? 'set' : 'NOT SET',
    },
    timestamp: new Date().toISOString(),
  });
};
