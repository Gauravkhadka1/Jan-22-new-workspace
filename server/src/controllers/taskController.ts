import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const { projectId, assignedTo } = req.query;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId ? { projectId: Number(projectId) } : {}), // Filter by projectId if provided
        ...(assignedTo ? { assignedTo: String(assignedTo) } : {}), // Convert assignedTo to string
      },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
  }
};


export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    title,
    description,
    status,
    priority,
    startDate,
    dueDate,
    projectId,
    assignedTo,
    assignedBy,
  } = req.body;
  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        startDate,
        dueDate,
        projectId,
        assignedTo,
        assignedBy,
      },
    });
    res.status(201).json(newTask);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating a task: ${error.message}` });
  }
};

export const updateTaskStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { taskId } = req.params;
  const { status } = req.body;
  try {
    const updatedTask = await prisma.task.update({
      where: {
        id: Number(taskId),
      },
      data: {
        status: status,
      },
    });
    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};

