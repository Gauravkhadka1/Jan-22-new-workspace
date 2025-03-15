import express from "express";
import { createUser, loginUser, getUsers, getUserByEmail, deleteUser, updateUserRole, changePassword,  } from "../controllers/userController";

const router = express.Router();

// Create a new user
router.post("/", createUser);

// Login user
router.post("/login", loginUser);  // <-- Add this line

// Get all users
router.get("/", getUsers);

// Get a user by email
router.get("/:email", getUserByEmail);

router.put("/role/:userId", updateUserRole);

// Delete a user by email
router.delete("/:email", deleteUser);

router.post("/:userId/change-password", changePassword);

export default router;

