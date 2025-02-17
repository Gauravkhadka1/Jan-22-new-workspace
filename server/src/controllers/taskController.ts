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

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const { status, updatedBy } = req.body; // Ensure the frontend sends `updatedBy` (userId)

  try {
    // Fetch the task before updating to get previous status
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: { project: true }, // Assuming there's a relation to fetch project details
    });

    if (!existingTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const previousStatus = existingTask.status;
    const taskName = existingTask.title;
    const projectName = existingTask.project ? existingTask.project.name : "Unknown Project";

    // Fetch the user who is updating the task
    const updatingUser = await prisma.user.findUnique({
      where: { userId: Number(updatedBy) }, // Ensure `updatedBy` is passed from frontend
    });

    if (!updatingUser) {
      res.status(400).json({ message: "Invalid user updating the task" });
      return;
    }

    // Update the task status
    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: { status },
    });

    // Send email notification
    const emailSubject = `Task Status Updated: ${taskName}`;
    const emailMessage = `
      <p><strong>${updatingUser.username}</strong> updated the task <strong>${taskName}</strong> of project <strong>${projectName}</strong>.</p>
      <p>Status changed from <strong>${previousStatus}</strong> to <strong>${status}</strong>.</p>
    `;

    sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);

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

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const {
    title,
    description,
    status,
    priority,
    startDate,
    dueDate,
    assignedTo,
    assignedBy,
    projectId,
  } = req.body;

  try {
    // Fetch the existing task before updating
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: { project: true },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: {
        title,
        description,
        status,
        priority,
        startDate,
        dueDate,
        assignedTo,
        assignedBy,
        projectId,
      },
    });

    // If assigned user has changed, send an email notification
    if (assignedTo && assignedTo !== existingTask.assignedTo) {
      const assignedUser = await prisma.user.findUnique({
        where: { userId: Number(assignedTo) },
      });

      if (assignedUser && assignedUser.email) {
        const emailSubject = `Task Updated: ${updatedTask.title}`;
        const emailMessage = `
          <p>You have been assigned a task: <strong>${updatedTask.title}</strong></p>
          <p><strong>Status:</strong> ${updatedTask.status}</p>
          <p><strong>Due Date:</strong> ${updatedTask.dueDate}</p>
          <p><strong>Priority:</strong> ${updatedTask.priority}</p>
        `;
        sendMail(assignedUser.email, emailSubject, emailMessage);
      }
    }

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};


