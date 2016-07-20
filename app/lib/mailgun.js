'use strict';

const request = require('request');
const path = require('path');
const encrypt = require('./crypt').encrypt;
const decrypt = require('./crypt').decrypt;
const mailgun = require('mailgun.js');
const pug = require('pug');

const testDecryption = (emailCrypt, redirectCrypt) => {
  return new Promise((resolve, reject) => {
    const decrypted = {
      email: decrypt(emailCrypt, process.env.CRYPTO_KEY),
      redirect: decrypt(redirectCrypt, process.env.CRYPTO_KEY),
    };

    resolve(decrypted);
  });
};

const sendConfirmation = (user, confLink) => {
  return new Promise((resolve, reject) => {
    const template = path.join(__dirname, '..', 'templates', 'confirmation.pug');
    const msgHTML = pug.renderFile(template, {
      user,
      confLink,
    });

    const message = {
      from: process.env.FROM_EMAIL,
      to: `${user.FNAME} <${user.EMAIL}>`,
      subject: 'Please confirm your email address',
      html: msgHTML,
    };

    sendMessage(message, resolve, reject);
  });
};

const sendMessage = (data, successCB, errorCB) => {
  const mg = mailgun.client({ key: process.env.MG_API_KEY, username: 'api' });
  const domain = process.env.MG_DOMAIN;
  const message = {
    from: data.from || `${domain} <donotreply@${domain}>`,
    to: data.to,
    subject: data.subject,
    html: data.html,
  };

  if (data.attachment) {
    message.attachment = request(data.attachment);
  }

  mg.messages.create(domain, message).then(successCB).catch(errorCB);
};

module.exports = {
  sendConfirmation,
  testDecryption,
};
