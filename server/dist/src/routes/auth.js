"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const router = (0, express_1.Router)();
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name } = req.body;
    try {
        // Check if user already exists
        const existingUser = yield prismaClient_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(400).json({ message: 'Email already in use.' });
            return;
        }
        // Hash the password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // Create a new user
        const newUser = yield prismaClient_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });
        res.status(201).json({
            message: 'User created successfully!',
            user: { id: newUser.id, email: newUser.email },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}));
exports.default = router;
