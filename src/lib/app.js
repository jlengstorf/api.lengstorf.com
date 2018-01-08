import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { saveSubscriber } from './mailchimp';
import { convertErrorToBase64, getErrorAsJSON } from './errors';

dotenv.config({ silent: true });

const ERROR_URL = process.env.ERROR_URL;
const CORS_WHITELIST = process.env.CORS_WHITELIST.split(',').map(function(s) {
  return s.trim();
});

export const sendResponse = (req, res, redirect) => {
  req.headers.accept === 'application/json'
    ? res.json({ redirect })
    : res.redirect(redirect);
};

export const handleUserPOST = async (req, res) => {
  try {
    const redirect = await saveSubscriber(req.body);

    sendResponse(req, res, redirect);
  } catch (err) {
    const errJSON = getErrorAsJSON(err);
    const errURL = `${ERROR_URL}?error=${convertErrorToBase64(errJSON)}`;

    sendResponse(req, res, errURL);
  }
};

export const validateOrigin = (origin, callback) => {
  if (CORS_WHITELIST.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
};

export const configure = app => {
  const corsOptions = { origin: validateOrigin };

  app.use(bodyParser.json());
  app.options('/user', cors(corsOptions));
  app.post('/user', cors(corsOptions), handleUserPOST);

  return app;
};

export const serve = app => {
  const port = process.env.PORT || 8080;
  app.set('port', Number(port));
  app.listen(app.get('port'));
};
