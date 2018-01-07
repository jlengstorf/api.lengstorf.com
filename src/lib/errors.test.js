import { getErrorAsJSON, convertErrorToBase64 } from './errors';

describe('lib/errors', () => {
  describe('convertErrorToBase64()', () => {
    test('converts an error object to Base64 for sending as a query param', () => {
      expect(convertErrorToBase64({ test: 'error' })).toEqual(
        'eyJ0ZXN0IjoiZXJyb3IifQ==',
      );
    });
  });

  describe('getErrorAsJSON()', () => {
    test('passes MailChimp errors through as-is', () => {
      const mcErr = {
        type:
          'http://developer.mailchimp.com/documentation/mailchimp/guides/error-glossary/',
        title: 'Invalid Resource',
        status: 400,
        detail: 'Please provide a valid email address.',
        instance: '214bf469-cb00-41a5-8f20-87ebb5a8320c',
      };

      expect(getErrorAsJSON(mcErr)).toEqual(mcErr);
    });

    test('converts an Error into JSON', () => {
      expect(getErrorAsJSON(Error('test description'))).toEqual({
        status: 400,
        title: 'Invalid Resource',
        type: 'API_Error',
        detail: 'test description',
      });
    });
  });
});
