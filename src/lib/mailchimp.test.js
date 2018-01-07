import dotenv from 'dotenv';
import { md5 } from './crypto';
import {
  getMembersEndpoint,
  getSubscriberDetails,
  saveSubscriber,
} from './mailchimp';

dotenv.config();

jest.mock('node-fetch', () => (_, { body }) =>
  Promise.resolve({
    json: () =>
      JSON.parse(body).email_address === 'test@lengstorf.com'
        ? { email_address: 'test@lengstorf.com' }
        : { status: 400, title: 'Invalid Resource' },
  }),
);

const mockPOST = {
  EMAIL: 'test@lengstorf.com',
  status: 'pending',
  FNAME: 'Jason',
  SOURCE: '/test/',
  DEFAULT: 1,
  redirect: 'https://example.org/confirm/',
};

describe('lib/mailchimp', () => {
  describe('getSubscriberDetails()', () => {
    test('builds subscriber data from the POST data', () => {
      expect(getSubscriberDetails(mockPOST)).toEqual({
        status_if_new: 'pending',
        email_address: 'test@lengstorf.com',
        merge_fields: {
          FNAME: 'Jason',
          SOURCE: '/test/',
          DEFAULT: 'true',
        },
      });
    });

    test('adds a "pending" status if none is set', () => {
      const noStatus = {
        ...mockPOST,
        status: undefined,
      };

      expect(getSubscriberDetails(noStatus)).toEqual(
        expect.objectContaining({
          status_if_new: 'pending',
        }),
      );
    });

    test('throws an error if the email is missing', () => {
      expect(() => {
        getSubscriberDetails({ FNAME: 'Test', status: 'invalid' });
      }).toThrowError('Please provide both an email and a first name.');
    });

    test('omits the group if no valid group is supplied', () => {
      expect(
        getSubscriberDetails({
          status: 'pending',
          EMAIL: 'email@example.org',
          FNAME: 'fname',
          NOTAGROUP: '1',
        }),
      ).toEqual({
        status_if_new: 'pending',
        email_address: 'email@example.org',
        merge_fields: {
          FNAME: 'fname',
          SOURCE: '',
        },
      });
    });
  });

  describe('getMembersEndpoint()', () => {
    test('builds the correct API endpoint', () => {
      const { MC_API_URL, MC_LIST_ID } = process.env;

      expect(getMembersEndpoint('foo@example.org')).toBe(
        `${MC_API_URL}/lists/${MC_LIST_ID}/members/${md5('foo@example.org')}`,
      );
    });
  });

  describe('saveSubscriber()', () => {
    test('saves a new subscriber', async () => {
      const redirect = await saveSubscriber(mockPOST);

      expect(redirect).toEqual('https://example.org/confirm/');
    });

    test('throws the error if MailChimp returns one', () => {
      const badEmail = {
        ...mockPOST,
        EMAIL: 'test@example.org', // MailChimp fails for `example.org`
      };

      return expect(saveSubscriber(badEmail)).rejects.toEqual(
        expect.objectContaining({ status: 400, title: 'Invalid Resource' }),
      );
    });

    test('uses lengstorf.com as a fallback if no redirect is supplied', () => {
      const noRedirect = { ...mockPOST, redirect: undefined };
      expect(saveSubscriber(noRedirect)).resolves.toEqual(
        'https://lengstorf.com',
      );
    });
  });
});
