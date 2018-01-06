import { encrypt, decrypt, md5 } from './crypto';

describe('lib/crypto', () => {
  const KEY = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

  test('does not generate the same has for the same string', () => {
    const encrypted1 = encrypt(KEY, 'test');
    const encrypted2 = encrypt(KEY, 'test');

    expect(encrypted1).not.toEqual(encrypted2);
  });

  test('successfully decrypts encrypted strings', () => {
    const testString = 'testme';
    const encrypted = encrypt(KEY, testString);

    expect(decrypt(KEY, encrypted)).toEqual(testString);
  });

  test('creates an MD5 hash of a given string', () => {
    expect(md5('test')).toEqual('098f6bcd4621d373cade4e832627b4f6');
  });
});
