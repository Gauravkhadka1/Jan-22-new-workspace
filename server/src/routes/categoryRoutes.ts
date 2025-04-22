import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  deleteMultipleCategories
} from "../controllers/categoryController";

const router = express.Router();

router.post("/", createCategory);
router.get("/", getCategories);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);
router.delete("/", deleteMultipleCategories);

export default router;