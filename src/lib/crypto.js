import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

export const encrypt = (key, text) => {
  const initializationVector = Buffer.from(crypto.randomBytes(16), 'utf8');
  const cipher = crypto.createCipheriv(ALGORITHM, key, initializationVector);
  const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

  return `${encrypted}-${initializationVector.toString('hex')}`;
};

export const decrypt = (key, hash) => {
  const parts = hash.split('-');
  const encryptedText = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
  const decrypted = decipher.update(encryptedText);

  return Buffer.concat([decrypted, decipher.final()]).toString();
};

export function md5(text) {
  return crypto
    .createHash('md5')
    .update(text)
    .digest('hex');
}
