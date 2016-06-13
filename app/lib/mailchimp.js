'use strict';

const https = require('https');
const crypto = require('crypto');

/**
 * Creates a hash of the user’s email to hit the proper API endpoint.
 * @param  {String} email the user’s email address
 * @return {String}       the hashed email
 */
const getSubscriberHash = email => {
  return crypto.createHash('md5').update(email).digest('hex');
};

/**
 * Loads information about a given subscriber.
 * @param  {String}   email    the email address of the user to look up
 * @param  {Function} callback callback to be fired on success or error
 * @return {Void}
 */
const getSubscriberData = (email, callback) => {
  const userHash = getSubscriberHash(email);

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
};

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
    status: 'subscribed',
    email_address: data.EMAIL,
    merge_fields: {
      FNAME: data.FNAME,
      SOURCE: data.SOURCE || '',
    },
  };

  // If group merge fields are set, include them.
  const optionalFields = ['PRODUCTIVE', 'TRAVEL'];
  optionalFields.forEach(field => {
    if (data[field]) {
      subscriber.merge_fields[field] = 'true';
    }
  });

  return subscriber;
};

/**
 * Updates or creates a subscriber with the given email.
 * @param  {Object}   data     the form payload
 * @param  {Function} callback callback to be fired on success or error
 * @return {Void}
 */
const upsertSubscriber = (data, callback) => {
  return new Promise((resolve, reject) => {
    const userHash = getSubscriberHash(data.EMAIL);
    const subscriberData = JSON.stringify(buildSubscriberData(data));

    // Configure the options for the MailChimp API request.
    const options = {
      method: 'PUT',
      host: process.env.MC_API_URL,
      path: `/3.0/lists/${process.env.MC_LIST_ID}/members/${userHash}`,
      auth: 'apikey:' + process.env.MC_API_KEY,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': subscriberData.length,
      },
    };

    // Create the request and set up handlers.
    const request = https.request(options, response => {
      let apiResponse = '';

      // The data is sent before the `end` event, so we have to capture it here.
      response.on('data', chunk => {
        apiResponse += chunk;
      });

      // Once all the data is loaded, we end up here and fire the callback.
      response.on('end', () => {

        // TODO add error check and return a more solid true/false
        resolve(data.redirect);
      });
    }).on('error', error => {
      reject(JSON.stringify(`Error: ${error.message}`));
    });

    // Add the subscriber’s data to the request body, then send it.
    request.write(subscriberData);
    request.end();
  });
};

module.exports = {
  getSubscriberData,
  upsertSubscriber,
};
