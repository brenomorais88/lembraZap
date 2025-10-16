const { admin } = require("../services/firebaseAdmin");

async function requireAuth(req, res, next) {
  try {
    const token =
      req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;

    if (!token) return res.status(401).json({ error: "missing_token" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    next();
  } catch (e) {
    res.status(401).json({ error: "unauthorized" });
  }
}

module.exports = { requireAuth };
