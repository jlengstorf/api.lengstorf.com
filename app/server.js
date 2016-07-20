'use strict';

/*
 * Load `.env` into `process.env`. Since this is deployed to Heroku (which has
 * its own way of handling env vars), we need to silence the errors if a `.env`
 * file isn’t present.
 */
require('dotenv').config({ silent: true });

const Hapi = require('hapi');
const server = new Hapi.Server();
const mailchimp = require('./lib/mailchimp');
const mailgun = require('./lib/mailgun');
const encrypt = require('./lib/crypt').encrypt;

server.connection({
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 1350,
});

// Handle form submissions to add someone to a given list.
server.route({
  method: 'POST',
  path: '/user',
  handler: (request, reply) => {
    mailchimp.saveSubscriber(request.payload, reply)
      .then(response => {
        mailgun.sendConfirmation(response.data, response.confLink)
          .then(() => {
            reply.redirect(response.data.redirect);
          })
          .catch(error => {
            reply(JSON.stringify(error));
          });
      })
      .catch(error => {
        reply(JSON.stringify(error));
      });
  },
});

server.route({
  method: 'GET',
  path: '/confirm/{emailCrypt}/{groupCrypt}',
  handler: (request, reply) => {
    mailchimp.confirmSubscriber(request.params.emailCrypt, request.params.groupCrypt)
      .then(redirectURI => {
        reply.redirect(redirectURI);
      })
      .catch(error => {
        reply(JSON.stringify(error));
      });
  },
});

// Start the server.
server.start(err => {
  if (err) {
    throw err;
  }

  console.log('Server running at ' + server.info.uri);
});
