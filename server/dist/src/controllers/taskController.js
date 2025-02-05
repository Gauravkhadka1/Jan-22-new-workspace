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
exports.getTasksByUserIdForUserTasks = exports.getTasksByUser = exports.updateTaskStatus = exports.createTask = exports.getTasks = void 0;
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
    }
    catch (error) {
        res.status(500).json({ message: `Error creating a task: ${error.message}` });
    }
});
exports.createTask = createTask;
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { status } = req.body;
    try {
        const updatedTask = yield prisma.task.update({
            where: {
                id: Number(taskId),
            },
            data: {
                status: status,
            },
        });
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
