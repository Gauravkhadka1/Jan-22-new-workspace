import { Router } from "express";
import {
  createTask,
  deleteTask,
  updateTask,
  getTasks,
  getTasksByUser,
  getTasksByUserIdForUserTasks, // Import the new function
  getTasksByUserIdForProfile, 
  updateTaskStatus,
} from "../controllers/taskController";

const router = Router();

router.get("/", getTasks);
router.get("/user/:userId", getTasksByUser);
router.get("/usertasks/:userId", getTasksByUserIdForUserTasks); // New route for user tasks
router.get("/profile/:userId", getTasksByUserIdForProfile);
router.post("/", createTask);
router.put("/:taskId", updateTask); 
router.delete("/:taskId", deleteTask); 
router.patch("/:taskId/status", updateTaskStatus);

export default router;
