import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.COOKIE_SAMESITE || "none",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds (30 days)
  })
}

export default generateToken;