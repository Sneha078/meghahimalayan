// catch async errors from the controllers and pass them to central error middleware

const handleAsyncError = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default handleAsyncError;