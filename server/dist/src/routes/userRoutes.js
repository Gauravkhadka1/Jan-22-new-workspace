"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
// Create a new user
router.post("/", userController_1.createUser);
// Get all users
router.get("/", userController_1.getUsers);
// Get a user by email
router.get("/:email", userController_1.getUserByEmail);
// Delete a user by email
router.delete("/:email", userController_1.deleteUser);
exports.default = router;
