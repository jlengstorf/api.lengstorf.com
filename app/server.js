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

server.connection({
  host: process.env.HOST,
  port: process.env.PORT,
});

// This endpoint isn’t currently necessary, so there’s no reason to expose it.
// server.route({
//   method: 'GET',
//   path: '/user/{email}',
//   handler: (request, reply) => {
//     mailchimp.getSubscriberData(request.params.email, reply);
//   },
// });

// Handle form submissions to add someone to a given list.
server.route({
  method: 'POST',
  path: '/user',
  handler: (request, reply) => {
    mailchimp.upsertSubscriber(request.payload, reply)
      .then(redirect => {

        // Every request supplies a redirect URI.
        reply.redirect(redirect);
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
