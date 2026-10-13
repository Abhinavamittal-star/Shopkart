const jwt = require("jsonwebtoken");

const generateToken = (res, customerId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured before issuing authentication tokens");
  }

  const token = jwt.sign(
    { id: customerId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // Store JWT inside HttpOnly cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  return token;
};

module.exports = generateToken;
