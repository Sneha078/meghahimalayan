// Generate JWT token
//store in httpOnly cookie
//and send JSON response
// Called from register, login, updatePassword, and resetPassword.
export const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  const cookieOptions = {
    // COOKIE_EXPIRE is in days
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    // not accessible from browser JS 
    //  prevents XSS token theft
    httpOnly: true,         
    sameSite: "lax",         // CSRF protection while allowing cross-origin GET
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
  };

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    token,
    user,
  });
};
