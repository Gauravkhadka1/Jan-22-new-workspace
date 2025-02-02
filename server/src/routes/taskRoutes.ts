import { Router } from "express";
import {
  createTask,
  getTasks,
  getTasksByUser,
  updateTaskStatus,
} from "../controllers/taskController";

const router = Router();

router.get("/", getTasks);
router.get("/user/:userId", getTasksByUser); 
router.post("/", createTask);
router.patch("/:taskId/status", updateTaskStatus);

export default router;