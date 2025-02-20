"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTasksByUserIdForUserTasks = exports.getTasksByUser = exports.updateTaskStatus = exports.createTask = exports.getTasks = void 0;
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma = new client_1.PrismaClient();
const transporter = nodemailer_1.default.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: "gauravkhadka111111@gmail.com",
        pass: "catgfxsmwkqrdknh", // It is recommended to use environment variables for sensitive data like passwords
    },
});
function sendMail(to, sub, msg) {
    transporter.sendMail({
        to: to,
        subject: sub,
        html: msg,
    });
    console.log("Email Sent");
}
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId, assignedTo } = req.query;
    try {
        const tasks = yield prisma.task.findMany({
            where: Object.assign(Object.assign({}, (projectId ? { projectId: Number(projectId) } : {})), (assignedTo ? { assignedTo: String(assignedTo) } : {})),
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasks = getTasks;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, status, priority, startDate, dueDate, projectId, assignedTo, assignedBy, } = req.body;
    try {
        const newTask = yield prisma.task.create({
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
        const assignedUser = yield prisma.user.findUnique({
            where: { userId: Number(assignedTo) }, // Correct field name
        });
        // Fetch the assigning user (assignedBy is an email)
        const assigningUser = yield prisma.user.findUnique({
            where: { email: assignedBy }, // Look up by email instead of userId
        });
        const project = yield prisma.project.findUnique({
            where: { id: Number(projectId) },
            select: { name: true }, // Only fetch the project name
        });
        if (assignedUser && assignedUser.email && assigningUser && project) {
            const emailSubject = `New Task Assigned: ${newTask.title}`;
            const emailMessage = `
        <p><strong>${assigningUser.username}</strong> assigned you a new task: <strong>${newTask.title}</strong> in <strong>${project.name}</strong></p>
        <p><strong>Start Date:</strong> ${newTask.startDate}</p>
        <p><strong>Due Date:</strong> ${newTask.dueDate}</p>  
      `;
            sendMail(assignedUser.email, emailSubject, emailMessage);
        }
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating a task: ${error.message}` });
    }
});
exports.createTask = createTask;
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { status, updatedBy } = req.body; // Ensure the frontend sends `updatedBy` (userId)
    try {
        // Fetch the task before updating to get previous status
        const existingTask = yield prisma.task.findUnique({
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
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: Number(updatedBy) }, // Ensure `updatedBy` is passed from frontend
        });
        if (!updatingUser) {
            res.status(400).json({ message: "Invalid user updating the task" });
            return;
        }
        // Update the task status
        const updatedTask = yield prisma.task.update({
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
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
});
exports.updateTaskStatus = updateTaskStatus;
const getTasksByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const tasks = yield prisma.task.findMany({
            where: {
                assignedTo: userId, // Fetch tasks assigned to the specific user
            },
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasksByUser = getTasksByUser;
const getTasksByUserIdForUserTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Fetch the userId from the params
    try {
        // Fetch tasks assigned to the specific user by userId
        const tasks = yield prisma.task.findMany({
            where: {
                assignedTo: userId, // Use the userId to fetch tasks
            },
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasksByUserIdForUserTasks = getTasksByUserIdForUserTasks;
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { title, description, status, priority, startDate, dueDate, assignedTo, assignedBy, projectId, } = req.body;
    try {
        // Fetch the existing task before updating
        const existingTask = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: { project: true },
        });
        if (!existingTask) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        // Update the task
        const updatedTask = yield prisma.task.update({
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
            const assignedUser = yield prisma.user.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
});
exports.updateTask = updateTask;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        // Find the task to get details before deletion
        const taskToDelete = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
        });
        if (!taskToDelete) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        // Delete the task
        yield prisma.task.delete({
            where: { id: Number(taskId) }
        });
        // Send an email notification to the assigned user
        const user = yield prisma.user.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting task: ${error.message}` });
    }
});
exports.deleteTask = deleteTask;
