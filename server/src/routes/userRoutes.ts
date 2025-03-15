import express from "express";
import { createUser, loginUser, getUsers, getUserByEmail, deleteUser, updateUserRole, changePassword, uploadProfilePicture  } from "../controllers/userController";
import upload from "../middleware/upload"; 

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

router.post("/:userId/profile-picture", upload.single("profilePicture"), uploadProfilePicture);

export default router;


