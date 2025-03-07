import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { format } from 'date-fns-tz';

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
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      select: { name: true }, // Only fetch the project name
    });
    const formatNepaliTime = (dateValue: Date | null) => {
      if (!dateValue) return "N/A"; // Return "N/A" or an empty string if the date is null
      return format(dateValue, "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
    };
    

    if (assignedUser && assignedUser.email && assigningUser && project) {
      const emailSubject = `New Task Assigned: ${newTask.title}`;

      const formattedStartDate = formatNepaliTime(newTask.startDate); // Convert UTC to Nepali Time
      const formattedDueDate = formatNepaliTime(newTask.dueDate); // Convert UTC to Nepali Time

      // Email for the assigned user
      const assignedUserMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Task Assigned</h2>
          </div>
          <div style="padding: 20px;">
            <p><strong style="color: #2c3e50;">${assigningUser.username}</strong> assigned you a new task <strong style="color: #3498db;">${newTask.title}</strong> in <strong style="color: #3498db;">${project.name}</strong>.</p>
       
          </div>
        </div>
      `;

      // Email for Gaurav
      const gauravMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Task Assigned</h2>
          </div>
          <div style="padding: 20px;">
            <p><strong style="color: #2c3e50;">${assigningUser.username}</strong> assigned <strong style="color: #2c3e50;">${assignedUser.username}</strong> a new task <strong style="color: #3498db;">${newTask.title}</strong> in <strong style="color: #3498db;">${project.name}</strong>.</p>
     
          </div>
        </div>
      `;

      // Send the email to the assigned user
      sendMail(assignedUser.email, emailSubject, assignedUserMessage);
      // Send a CC to Gaurav
      sendMail('gaurav@webtech.com.np', emailSubject, gauravMessage);
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
    // Fetch the existing task before updating, including project details
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: {
        project: true,
      },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Get the logged-in user's username from the custom header
    const loggedInUsername = req.headers["x-logged-in-user"] as string;
    if (!loggedInUsername) {
      res.status(401).json({ message: "Unauthorized: No logged-in user provided" });
      return;
    }

    // Verify the user exists in the database
    const updatingUser = await prisma.user.findFirst({
      where: { username: loggedInUsername },
    });

    if (!updatingUser) {
      res.status(400).json({ message: "Invalid user updating the task" });
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
      include: {
        project: true,
      },
    });

    // Compare old and new values to detect changes
    const changes: string[] = [];

    if (title && title !== existingTask.title) {
      changes.push(`Task Title: <strong>${existingTask.title}</strong> → <strong>${title}</strong>`);
    }
    if (description !== undefined && description !== existingTask.description) {
      changes.push(`Description: <strong>${existingTask.description || "N/A"}</strong> → <strong>${description || "N/A"}</strong>`);
    }
    if (status && status !== existingTask.status) {
      changes.push(`Status: <strong>${existingTask.status || "N/A"}</strong> → <strong>${status}</strong>`);
    }
    if (priority && priority !== existingTask.priority) {
      changes.push(`Priority: <strong>${existingTask.priority || "N/A"}</strong> → <strong>${priority}</strong>`);
    }
    if (startDate && existingTask.startDate !== null && new Date(startDate).getTime() !== new Date(existingTask.startDate).getTime()) {
      const oldStartDate = format(new Date(existingTask.startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
      const newStartDate = format(new Date(startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
      changes.push(`Start Date: <strong>${oldStartDate}</strong> → <strong>${newStartDate}</strong>`);
    }
    
    if (dueDate && existingTask.dueDate !== null && new Date(dueDate).getTime() !== new Date(existingTask.dueDate).getTime()) {
      const oldDueDate = format(new Date(existingTask.dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
      const newDueDate = format(new Date(dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
      changes.push(`Due Date: <strong>${oldDueDate}</strong> → <strong>${newDueDate}</strong>`);
    }
    if (assignedTo && assignedTo !== existingTask.assignedTo) {
      const oldAssignee = (await prisma.user.findUnique({ where: { email: existingTask.assignedTo } }))?.username || existingTask.assignedTo || "N/A";
      const newAssignee = (await prisma.user.findUnique({ where: { email: assignedTo } }))?.username || assignedTo || "N/A";
      changes.push(`Assigned To: <strong>${oldAssignee}</strong> → <strong>${newAssignee}</strong>`);
    }
    if (projectId && projectId !== existingTask.projectId) {
      const oldProject = existingTask.project?.name || "N/A";
      const newProject = (await prisma.project.findUnique({ where: { id: Number(projectId) } }))?.name || "N/A";
      changes.push(`Project: <strong>${oldProject}</strong> → <strong>${newProject}</strong>`);
    }
    if (assignedBy && assignedBy !== existingTask.assignedBy) {
      const oldAssignedBy = (await prisma.user.findUnique({ where: { email: existingTask.assignedBy } }))?.username || existingTask.assignedBy || "N/A";
      const newAssignedBy = (await prisma.user.findUnique({ where: { email: assignedBy } }))?.username || assignedBy || "N/A";
      changes.push(`Assigned By: <strong>${oldAssignedBy}</strong> → <strong>${newAssignedBy}</strong>`);
    }

    // Send email if there are any changes
    if (changes.length > 0) {
      const emailSubject = `Task Updated: ${updatedTask.title}`;
      const emailMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white; margin: 0;">
            Task Updated by ${updatingUser.username}
          </h2>
          <div style="padding: 20px;">
            <p>
              <strong>${updatingUser.username}</strong> updated the task <strong>${updatedTask.title}</strong> of <strong>${existingTask.project?.name || "Unknown Project"}</strong>:
            </p>
            <ul style="list-style-type: disc; padding-left: 20px;">
              ${changes.map(change => `<li>${change}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
      sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
    }

    // If assigned user has changed, send an email notification to the new assignee
    if (assignedTo && assignedTo !== existingTask.assignedTo) {
      const assignedUser = await prisma.user.findUnique({
        where: { email: assignedTo },
      });

      if (assignedUser && assignedUser.email) {
        const emailSubject = `Task Assigned: ${updatedTask.title}`;
        const emailMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <h2 style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white; margin: 0;">
              Task Assignment
            </h2>
            <div style="padding: 20px;">
              <p>You have been assigned a task: <strong>${updatedTask.title}</strong></p>
              <p><strong>Status:</strong> ${updatedTask.status || "N/A"}</p>
              <p><strong>Due Date:</strong> ${updatedTask.dueDate ? format(new Date(updatedTask.dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" }) : "N/A"}</p>
              <p><strong>Priority:</strong> ${updatedTask.priority || "N/A"}</p>
            </div>
          </div>
        `;
        sendMail(assignedUser.email, emailSubject, emailMessage);
      }
    }

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;

  try {
    // Find the task to get details before deletion
    const taskToDelete = await prisma.task.findUnique({
      where: { id: Number(taskId) },
    });

    if (!taskToDelete) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: Number(taskId) }
    });

    // Send an email notification to the assigned user
    const user = await prisma.user.findUnique({
      where: { email: taskToDelete.assignedTo } // Use assignedTo as it contains the email
    });

    if (user) {
      const emailSubject = `Task Deleted: ${taskToDelete.title}`;
      const emailMessage = `
        <p>Your task <strong>${taskToDelete.title}</strong> has been deleted.</p>
      `;
      sendMail(user.email, emailSubject, emailMessage);
    }

    res.status(200).json({ message: "Task successfully deleted" });
  } catch (error: any) {
    res.status(500).json({ message: `Error deleting task: ${error.message}` });
  }
};