import * as app from './lib/app';

jest.mock('express', () => () => 'TEST_APP');

app.configure = jest.fn();
app.serve = jest.fn();

describe('index', () => {
  test('creates an Express app, configures it, and serves it', () => {
    // eslint-disable-next-line global-require
    require('./index');
    expect(app.configure).toBeCalledWith('TEST_APP');
    expect(app.serve).toBeCalledWith('TEST_APP');
  });
});
