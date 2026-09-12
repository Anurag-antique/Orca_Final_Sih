const jwt = require("jsonwebtoken");
const config = require("../config");
const UserModel = require("../models/user.model");

/**
 * Paths that may accept a token from `?token=` because the browser API
 * they serve (EventSource / SSE) cannot set an Authorization header.
 * This list must stay minimal and explicit.
 */
const QUERY_TOKEN_ALLOWED_PATHS = ["/notifications/stream"];

function isQueryTokenAllowed(req) {
  if (!req.originalUrl) return false;
  const pathOnly = req.originalUrl.split("?")[0];
  return QUERY_TOKEN_ALLOWED_PATHS.some((p) => pathOnly.endsWith(p));
}

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (
      isQueryTokenAllowed(req) &&
      typeof req.query.token === "string" &&
      req.query.token.length
    ) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing or invalid format",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists",
      });
    }

    req.user = UserModel.sanitizeUser(user);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
