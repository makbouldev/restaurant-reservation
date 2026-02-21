const express = require('express');
const {
  isValidAdminCredentials,
  getAdminProfile,
  issueAdminToken,
  verifyToken,
  clearToken,
  readTokenFromRequest
} = require('../auth');

const router = express.Router();

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const isValid = await isValidAdminCredentials(email, password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    const token = issueAdminToken(String(email).trim().toLowerCase());
    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.' });
  }
});

router.get('/admin/verify', (req, res) => {
  const token = readTokenFromRequest(req);
  if (!verifyToken(token)) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  return res.json({ ok: true });
});

router.post('/admin/logout', (req, res) => {
  const token = readTokenFromRequest(req);
  if (token) clearToken(token);
  return res.json({ message: 'Logged out.' });
});

router.get('/admin/profile', async (req, res) => {
  const token = readTokenFromRequest(req);
  if (!verifyToken(token)) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  try {
    const profile = await getAdminProfile();
    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load admin profile.' });
  }
});

module.exports = router;
