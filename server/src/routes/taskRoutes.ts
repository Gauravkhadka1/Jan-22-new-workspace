import { Router } from "express";
import {
  createTask,
  updateTask,
  getTasks,
  getTasksByUser,
  getTasksByUserIdForUserTasks, // Import the new function
  updateTaskStatus,
} from "../controllers/taskController";

const router = Router();

router.get("/", getTasks);
router.get("/user/:userId", getTasksByUser);
router.get("/usertasks/:userId", getTasksByUserIdForUserTasks); // New route for user tasks
router.post("/", createTask);
router.put("/:taskId", updateTask); 
router.patch("/:taskId/status", updateTaskStatus);

export default router;
