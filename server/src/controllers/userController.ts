import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Create a new user
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, profilePictureUrl, password } = req.body;

    // Ensure email is provided
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        profilePictureUrl: profilePictureUrl || "default.jpg", // Set default profile picture if not provided
        password,
      },
    });

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: `Error creating user: ${error.message}` });
  }
};

/**
 * Get all users
 */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error: any) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ message: `Error retrieving users: ${error.message}` });
  }
};

/**
 * Get a user by email
 */
export const getUserByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ message: `Error retrieving user: ${error.message}` });
  }
};

/**
 * Delete a user by email
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    const deletedUser = await prisma.user.delete({
      where: { email },
    });

    res.json({ message: "User deleted successfully", user: deletedUser });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: `Error deleting user: ${error.message}` });
  }
};
