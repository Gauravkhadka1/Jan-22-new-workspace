"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateUser = (req, res, next) => {
    var _a, _b;
    const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.authToken) || ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]);
    // If no token, respond with Unauthorized status
    if (!token) {
        res.status(401).json({ message: "Unauthorized: Please log in first." });
        return; // End the request-response cycle here
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the decoded user info to the request object
        next(); // Pass control to the next middleware or route handler
    }
    catch (error) {
        res.status(403).json({ message: "Forbidden: Invalid token." });
        return; // End the request-response cycle here
    }
};
exports.authenticateUser = authenticateUser;
