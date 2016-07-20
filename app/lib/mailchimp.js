'use strict';

const https = require('https');
const md5 = require('./crypt').md5;
const encrypt = require('./crypt').encrypt;
const decrypt = require('./crypt').decrypt;

/**
 * Loads information about a given subscriber.
 * @param  {String}   email    the email address of the user to look up
 * @param  {Function} callback callback to be fired on success or error
 * @return {Void}
 */
/*const getSubscriberData = (email, callback) => {
  const userHash = md5(email);

  // Configure the options for the MailChimp API request.
  const options = {
    host: process.env.MC_API_URL,
    path: `/3.0/lists/${process.env.MC_LIST_ID}/members/${userHash}`,
    method: 'GET',
    auth: 'apikey:' + process.env.MC_API_KEY,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Create the request and set up the handlers.
  const request = https.get(options, res => {
    let data = '';

    // The data is sent before the `end` event, so we capture it here.
    res.on('data', chunk => {
      data += chunk;
    });

    // Once the data is loaded, we end up here and fire the callback.
    res.on('end', res => {
      callback(data);
    });
  }).on('error', error => {
    callback(JSON.stringify(`Got error: ${error.message}`));
  });
};*/

/**
 * Creates an object with the subscriber data to send to MailChimp.
 * @param  {Object} data the payload from the form submission
 * @return {Object}      a MailChimp-friendly user object
 */
const buildSubscriberData = data => {
  if (!data.EMAIL || !data.FNAME) {
    return false;
  }

  // See <http://bit.ly/1VTqRMl> for all available fields.
  const subscriber = {
    status: data.status,
    email_address: data.EMAIL,
    merge_fields: {
      FNAME: data.FNAME,
      SOURCE: data.SOURCE || '',
    },
  };

  // If group merge fields are set, include them.
  const optionalFields = ['PRODUCTIVE', 'TRAVEL', 'WORKHAPPY'];
  optionalFields.forEach(field => {
    if (data[field]) {
      subscriber.merge_fields[field] = 'true';
    }
  });

  return subscriber;
};

const generateConfirmationLink = (email, group) => {
  const emailCrypt = encrypt(process.env.CRYPTO_KEY, email);
  const groupCrypt = encrypt(process.env.CRYPTO_KEY, group);

  return `${process.env.API_URL}/confirm/${emailCrypt}/${groupCrypt}`;
};

const getMemberEndpoint = email => {
  return `/3.0/lists/${process.env.MC_LIST_ID}/members/${md5(email)}`;
};

const upsertSubscriber = subscriber => {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify(subscriber);
    const options = {
      method: 'PUT',
      host: process.env.MC_API_URL,
      path: getMemberEndpoint(subscriber.email_address),
      auth: `apikey:${process.env.MC_API_KEY}`,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': requestData.length,
      },
    };

    const request = https.request(options, req => {
      let response = '';

      req.on('data', chunk => {
        response += chunk;
      });

      req.on('end', () => {
        const res = JSON.parse(response);
        const valid_status = [
          'subscribed',
          'unsubscribed',
          'cleaned',
          'pending',
        ];

        if (valid_status.filter(a => a===res.status).length > 0) {
          resolve(res);
        } else {
          reject(res);
        }
      });
    }).on('error', reject);

    request.write(requestData);
    request.end();
  });
};

const saveSubscriber = (data, callback) => {
  return new Promise((resolve, reject) => {
    const subscriber = buildSubscriberData(data);

    let group = false;
    if (subscriber.merge_fields.PRODUCTIVE) {
      group = 'PRODUCTIVE';
    } else if (subscriber.merge_fields.TRAVEL) {
      group = 'TRAVEL';
    } else if (subscriber.merge_fields.WORKHAPPY) {
      group = 'WORKHAPPY';
    }

    upsertSubscriber(subscriber)
      .then(user => {
        const response = {
          user,
          data,
          confLink: generateConfirmationLink(data.EMAIL, group),
        };

        resolve(response);
      })
      .catch(reject);
  });
};

const confirmSubscriber = (encryptedEmail, encryptedGroup) => {
  return new Promise((resolve, reject) => {
    const email = decrypt(process.env.CRYPTO_KEY, encryptedEmail);
    const group = decrypt(process.env.CRYPTO_KEY, encryptedGroup);
    const redirect = process.env[`TY_${group}`] || false;
    const subscriber = {
      status: 'subscribed',
      email_address: email,
    };

    upsertSubscriber(subscriber)
      .then(user => {
        resolve(redirect);
      })
      .catch(reject);
  });
};

module.exports = {
  saveSubscriber,
  confirmSubscriber,
};
