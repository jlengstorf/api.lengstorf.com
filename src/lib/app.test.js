import dotenv from 'dotenv';
import { configure, serve, handleUserPOST, validateOrigin } from './app';
import * as mailchimp from './mailchimp';
import { getErrorAsJSON, convertErrorToBase64 } from './errors';

dotenv.config({ silent: true });

jest.mock('body-parser', () => ({
  json: () => 'bodyParser.json()',
}));

mailchimp.saveSubscriber = jest.fn(() =>
  Promise.resolve('https://example.org/'),
);

const mockApp = {
  get: jest.fn(() => process.env.PORT || 8080),
  set: jest.fn(),
  listen: jest.fn(),
  use: jest.fn(),
  post: jest.fn(),
  options: jest.fn(),
};

const mockReq = {
  headers: {},
  body: {},
};

const mockRes = {
  redirect: jest.fn(),
  json: jest.fn(),
  end: jest.fn(),
};

describe('lib/app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateOrigin()', () => {
    test('correctly validates CORS whitelisted origins', () => {
      const testOrigin = process.env.CORS_WHITELIST.split(',')
        .map(s => s.trim())
        .find(v => v);
      const cb = jest.fn();

      validateOrigin(testOrigin, cb);

      expect(cb).toBeCalledWith(null, true);
    });

    test('throws an error if in invalid origin is detected', () => {
      const badOrigin = 'https://evil.org';
      const cb = jest.fn();

      validateOrigin(badOrigin, cb);
      expect(cb).toBeCalledWith(
        new Error('Origin https://evil.org is not allowed by CORS'),
      );
    });
  });

  describe('handleUserPOST()', () => {
    test('redirects the user on a successful call', async () => {
      expect.assertions(1);

      await handleUserPOST(mockReq, mockRes);

      expect(mockRes.redirect).toBeCalledWith('https://example.org/');
    });

    test('sends the redirect as JSON if the accept header specifies JSON', async () => {
      expect.assertions(1);

      const jsonReq = { headers: { accept: 'application/json' } };
      await handleUserPOST(jsonReq, mockRes);

      expect(mockRes.json).toBeCalledWith({ redirect: 'https://example.org/' });
    });

    test('sends the error as JSON', async () => {
      expect.assertions(1);

      mailchimp.saveSubscriber.mockImplementationOnce(() => {
        throw Error('test');
      });

      await handleUserPOST({ body: {} }, mockRes);

      const expectedError = convertErrorToBase64(getErrorAsJSON(Error('test')));

      expect(mockRes.redirect).toBeCalledWith(
        `${process.env.ERROR_URL}?error=${expectedError}`,
      );
    });
  });

  describe('configure()', () => {
    test('uses the correct middleware and registers the endpoints', () => {
      configure(mockApp);

      expect(mockApp.use).toBeCalledWith('bodyParser.json()');
    });
  });

  describe('serve()', () => {
    beforeAll(() => {
      delete process.env.PORT;
    });

    afterEach(() => {
      delete process.env.PORT;
    });

    test('uses port 8080 if no port is defined', () => {
      serve(mockApp);

      expect(mockApp.set).toBeCalledWith('port', 8080);
      expect(mockApp.listen).toBeCalledWith(8080);
    });

    test('uses a custom port if one is supplied', () => {
      process.env.PORT = 1234;

      serve(mockApp);

      expect(mockApp.set).toBeCalledWith('port', 1234);
      expect(mockApp.listen).toBeCalledWith(1234);
    });
  });
});
