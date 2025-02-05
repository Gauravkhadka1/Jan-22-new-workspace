import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "gauravkhadka111111@gmail.com",
    pass: "catgfxsmwkqrdknh", // It is recommended to use environment variables for sensitive data like passwords
  },
});
function sendMail(to: string, sub: string, msg: string) {
  transporter.sendMail({
    to: to,
    subject: sub,
    html: msg,
  });
  console.log("Email Sent");
}

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


export const createTask = async (req: Request, res: Response): Promise<void> => {
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

    // Fetch the assigned user's email
    const assignedUser = await prisma.user.findUnique({
      where: { userId: Number(assignedTo) }, // Correct field name
    });

    // Fetch the assigning user (assignedBy is an email)
    const assigningUser = await prisma.user.findUnique({
      where: { email: assignedBy }, // Look up by email instead of userId
    });

    if (assignedUser && assignedUser.email && assigningUser) {
      const emailSubject = `New Task Assigned: ${newTask.title}`;
      const emailMessage = `
        <p><strong>${assigningUser.username}</strong> assigned you a new task: <strong>${newTask.title}</strong></p>
        <p><strong>Start Date:</strong> ${newTask.startDate}</p>
        <p><strong>Due Date:</strong> ${newTask.dueDate}</p>
        <p><strong>Description:</strong> ${newTask.description}</p>
        <p><strong>Priority:</strong> ${newTask.priority}</p>
      `;

      sendMail(assignedUser.email, emailSubject, emailMessage);
    }

    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating a task: ${error.message}` });
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

export const getTasksByUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: userId, // Fetch tasks assigned to the specific user
      },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
  }
};
export const getTasksByUserIdForUserTasks = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params; // Fetch the userId from the params

  try {
    // Fetch tasks assigned to the specific user by userId
    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: userId, // Use the userId to fetch tasks
      },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
  }
};


