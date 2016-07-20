/*
 * # Encryption and Decryption of Strings
 * Reversible, password-based text encryption for passing data in URIs.
 *
 * Based on <http://lollyrock.com/articles/nodejs-encryption/>
 */
'use strict';

const crypto = require('crypto');

/**
 * Returns an encrypted string
 * @param  {String} key  a key that makes the encryption reversible
 * @param  {String} text the string to be encrypted
 * @return {String}      the encrypted string
 */
const encrypt = (key, text) => {
  const cipher = crypto.createCipher('aes-256-ctr', key);
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
};

/**
 * Decrypts and encrypted string
 * @param  {String} key  the key that was used to encrypt the string
 * @param  {String} text the encrypted string
 * @return {String}      the decrypted string
 */
const decrypt = (key, text) => {
  const decipher = crypto.createDecipher('aes-256-ctr', key);
  return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
};

/**
 * Creates an MD5 hash of a given string
 * @param  {String} text the text to hash
 * @return {String}      the hashed text
 */
const md5 = text => {
  return crypto.createHash('md5').update(text).digest('hex');
};

module.exports = {
  encrypt,
  decrypt,
  md5,
};
