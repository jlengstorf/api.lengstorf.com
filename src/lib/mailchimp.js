import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { md5 } from './crypto';

dotenv.config({ silent: true });

const GROUPS = ['PRODUCTIVE', 'TRAVEL', 'WORKHAPPY', 'DEFAULT'];
const { MC_LIST_ID, MC_API_URL, MC_API_KEY } = process.env;

export function getMembersEndpoint(email) {
  return `${MC_API_URL}/lists/${MC_LIST_ID}/members/${md5(email)}`;
}

export function getBasicAuth() {
  return `Basic ${Buffer.from(`api:${MC_API_KEY}`, 'utf8').toString('base64')}`;
}

export const getSubscriberDetails = ({
  EMAIL,
  FNAME,
  SOURCE = '',
  status = 'pending',
  ...rest
}) => {
  if (!EMAIL || !FNAME) {
    throw new Error('Please provide both an email and a first name.');
  }

  const group = GROUPS.find(function validGroup(g) {
    return rest[g];
  });

  return {
    status_if_new: status,
    email_address: EMAIL,
    merge_fields: {
      FNAME,
      SOURCE,
      ...(group ? { [group]: 'true' } : {}),
    },
  };
};

function upsertSubscriber(subscriber, redirect) {
  return fetch(getMembersEndpoint(subscriber.email_address), {
    method: 'PUT',
    body: JSON.stringify(subscriber),
    headers: {
      'Content-Type': 'application/json',
      Authorization: getBasicAuth(),
    },
  })
    .then(function parseJSON(res) {
      return res.json();
    })
    .then(json => {
      if (json.email_address !== subscriber.email_address) {
        throw json;
      }

      return redirect;
    });
}

export const saveSubscriber = data => {
  const subscriber = getSubscriberDetails(data);
  const redirect = data.redirect || 'https://lengstorf.com';

  return upsertSubscriber(subscriber, redirect);
};
