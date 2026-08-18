//Handle error (custom error class that inherit JavaScript error properties )
//error messgage,http status code, error information 
class HandleError extends Error {
  // constructor recevies error msg and HTTP status code
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes our errors from unexpected crashes
    Error.captureStackTrace(this, this.constructor);
  }
}

export default HandleError;
