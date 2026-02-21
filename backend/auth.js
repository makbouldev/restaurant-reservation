const crypto = require('crypto');
const { get, run } = require('./db');
const { hashPassword, verifyPassword } = require('./security');

const tokenTtlMs = 8 * 60 * 60 * 1000;
const sessions = new Map();

async function isValidAdminCredentials(email, password) {
  const account = await get('SELECT email, password_hash, password_salt FROM admin_account WHERE id = 1');
  if (!account) return false;
  if (String(email || '').trim().toLowerCase() !== String(account.email || '').trim().toLowerCase()) return false;
  return verifyPassword(password, account.password_salt, account.password_hash);
}

async function getAdminProfile() {
  const account = await get('SELECT email FROM admin_account WHERE id = 1');
  const logo = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['site_logo']);
  const displayName = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['admin_display_name']);
  const profilePhoto = await get('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['admin_profile_photo']);
  return {
    email: account?.email || '',
    logoPath: logo?.setting_value || '',
    displayName: displayName?.setting_value || 'Admin NeonBite',
    profilePhotoPath: profilePhoto?.setting_value || ''
  };
}

async function updateAdminCredentials({ nextEmail, nextPassword }) {
  const account = await get('SELECT email FROM admin_account WHERE id = 1');
  if (!account) throw new Error('Admin account not found.');

  const normalizedEmail = String(nextEmail || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Admin email is required.');

  if (nextPassword) {
    const { hash, salt } = hashPassword(nextPassword);
    await run(
      `UPDATE admin_account
       SET email = ?, password_hash = ?, password_salt = ?, updated_at = datetime('now')
       WHERE id = 1`,
      [normalizedEmail, hash, salt]
    );
  } else {
    await run(
      `UPDATE admin_account
       SET email = ?, updated_at = datetime('now')
       WHERE id = 1`,
      [normalizedEmail]
    );
  }
}

function issueAdminToken(email) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    email,
    expiresAt: Date.now() + tokenTtlMs
  });
  return token;
}

function readTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice(7).trim();
}

function requireAdmin(req, res, next) {
  const token = readTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required.' });
  }

  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ message: 'Invalid admin session.' });
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ message: 'Admin session expired.' });
  }

  req.admin = { email: session.email };
  return next();
}

function verifyToken(token) {
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function clearToken(token) {
  sessions.delete(token);
}

function clearAllTokens() {
  sessions.clear();
}

module.exports = {
  isValidAdminCredentials,
  getAdminProfile,
  updateAdminCredentials,
  issueAdminToken,
  requireAdmin,
  verifyToken,
  clearToken,
  clearAllTokens,
  readTokenFromRequest
};
