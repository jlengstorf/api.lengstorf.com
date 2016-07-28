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

/*
 * This is a quick-and-dirty function that emails me whenever something fails
 * in this API. I don’t want to use it for long, but while I’m still feeling
 * out what does and doesn’t work, I need a super-annoying way of reminding me
 * that shit isn’t working 100% yet.
 */
const reportError = (error) => {

  // Sends me the error details.
  mailgun.sendMessage({
    to: 'Jason Lengstorf <jason@lengstorf.com>',
    subject: `api.lengstorf.com: ${error.title} Error (${error.status})`,
    html: `<p>There was a ${error.title} Error (${error.status}) on api.lengstorf.com.</p><p>Details: ${error.detail}</p>`,
  });
}

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
        reply.redirect(response.data.redirect);

        /*mailgun.sendConfirmation(response.data, response.confLink)
          .then(() => {
            reply.redirect(response.data.redirect);
          })
          .catch(error => {
            reportError(error);
            reply.redirect(process.env.ERROR_URI);
          });*/
      })
      .catch(error => {
        reportError(error);
        reply.redirect(process.env.ERROR_URI);
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
        reportError(error);
        reply.redirect(process.env.ERROR_URI);
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
