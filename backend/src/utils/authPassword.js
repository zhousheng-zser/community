const crypto = require('crypto');

const SMS_CODE_DEFAULT = '024680';

function hashPassword(raw) {
  const salt = crypto.randomBytes(8).toString('hex');
  const hash = crypto.createHash('sha256').update(`${salt}:${String(raw)}`).digest('hex');
  return { salt, hash };
}

function verifyPassword(user, rawPassword) {
  const saltRaw = String(user && user.wx_id ? user.wx_id : '');
  const hashRaw = String(user && user.bank_num ? user.bank_num : '');
  if (!saltRaw.startsWith('pwd_salt:') || !hashRaw.startsWith('pwd_hash:')) return false;
  const salt = saltRaw.slice('pwd_salt:'.length);
  const stored = hashRaw.slice('pwd_hash:'.length);
  const calc = crypto.createHash('sha256').update(`${salt}:${String(rawPassword)}`).digest('hex');
  return calc === stored;
}

function verifySmsCode(code) {
  return String(code) === SMS_CODE_DEFAULT;
}

function applyPasswordFields(user, password) {
  const { salt, hash } = hashPassword(password);
  user.wx_id = `pwd_salt:${salt}`;
  user.bank_num = `pwd_hash:${hash}`;
}

module.exports = {
  SMS_CODE_DEFAULT,
  hashPassword,
  verifyPassword,
  verifySmsCode,
  applyPasswordFields
};
