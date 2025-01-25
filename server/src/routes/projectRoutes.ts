import { Router } from "express";
import { createProject, getProjects, updateProjectStatus, } from "../controllers/projectController";

const router = Router();

router.get("/", getProjects);
router.post("/", createProject);
router.patch("/:projectId/status", updateProjectStatus);

export default router;