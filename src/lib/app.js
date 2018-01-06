import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { saveSubscriber } from './mailchimp';
import { convertErrorToBase64, getErrorAsJSON } from './errors';

dotenv.config({ silent: true });

const ERROR_URL = process.env.ERROR_URL;

export const handleUserPOST = async (req, res) => {
  try {
    const redirect = await saveSubscriber(req.body);

    res.redirect(redirect);
  } catch (err) {
    const errJSON = getErrorAsJSON(err);
    const errURL = `${ERROR_URL}?error=${convertErrorToBase64(errJSON)}`;

    res.redirect(errURL);
  }
};

export const configure = app => {
  app.use(bodyParser.json());

  app.post('/user', handleUserPOST);

  return app;
};

export const serve = app => {
  const port = process.env.PORT || 8080;
  app.set('port', Number(port));
  app.listen(app.get('port'));
};
