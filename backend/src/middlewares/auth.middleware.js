import jwt from "jsonwebtoken";
import httpStatus from "http-status";

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.body.token || req.query.token;

  if (!token) {
    return res.status(httpStatus.UNAUTHORIZED).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired token." });
  }
};
