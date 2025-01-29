import express from "express";
import { createUser, loginUser, getUsers, getUserByEmail, deleteUser } from "../controllers/userController";

const router = express.Router();

// Create a new user
router.post("/", createUser);

// Login user
router.post("/login", loginUser);  // <-- Add this line

// Get all users
router.get("/", getUsers);

// Get a user by email
router.get("/:email", getUserByEmail);

// Delete a user by email
router.delete("/:email", deleteUser);

export default router;
