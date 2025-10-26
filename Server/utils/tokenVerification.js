// ...existing code...
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // support token from cookie, Authorization header (Bearer ...), or x-access-token header
    const tokenFromCookie = req.cookies && req.cookies.token;
    const authHeader = req.headers && req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : req.headers["x-access-token"];

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
        // attach standard places used in your routes
        req.user = decoded;
        req.adminId = decoded.id || decoded._id || decoded.userId;
        return next();
    } catch (err) {
        // clear cookie if present and respond once
        if (typeof res.clearCookie === "function") {
            res.clearCookie("token");
        }
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

module.exports = { verifyToken };
// ...existing code...