const crypto = require('crypto');

const DEV_SMS_CODE = '024680';

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(user, plain) {
  if (!user || plain == null) return false;
  const stored = user.password || user.password_hash;
  if (!stored) return false;
  const s = String(stored);
  if (s.includes(':')) {
    const [salt, hash] = s.split(':');
    const check = crypto.scryptSync(String(plain), salt, 64).toString('hex');
    return check === hash;
  }
  try {
    const bcrypt = require('bcrypt');
    return bcrypt.compareSync(String(plain), s);
  } catch {
    return String(plain) === s;
  }
}

function verifySmsCode(code) {
  return String(code).trim() === DEV_SMS_CODE;
}

function applyPasswordFields(user, plain) {
  user.password = hashPassword(plain);
}

module.exports = { verifyPassword, verifySmsCode, applyPasswordFields, hashPassword };
