export function convertErrorToBase64(error) {
  return Buffer.from(JSON.stringify(error)).toString('base64');
}

export function getErrorAsJSON(error) {
  return error.hasOwnProperty('message')
    ? {
        status: 400,
        type: 'API_Error',
        title: 'Invalid Resource',
        detail: error.message,
      }
    : error;
}
