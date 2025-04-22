import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { categoryName, categoryCode } = req.body;

    const category = await prisma.category.create({
      data: {
        categoryName,
        categoryCode
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryName, categoryCode } = req.body;

    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        categoryName,
        categoryCode
      }
    });

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: Number(id) }
    });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};

export const deleteMultipleCategories = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    await prisma.category.deleteMany({
      where: { id: { in: ids.map((id: string) => Number(id)) } }
    });
    res.status(200).json({ message: "Categories deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete categories" });
  }
};