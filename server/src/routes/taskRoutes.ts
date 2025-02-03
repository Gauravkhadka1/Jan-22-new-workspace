import { Router } from "express";
import {
  createTask,
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
router.patch("/:taskId/status", updateTaskStatus);

export default router;
