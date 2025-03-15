import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";
/* ROUTE IMPORTS */
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import userRoutes from "./routes/userRoutes";

// import searchRoutes from "./routes/searchRoutes";

/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "https://webtech.mobi.np", // Allow requests from this origin
    credentials: true, // Allow credentials (e.g., cookies)
  })
);
app.get("/uploads/:filename", (req: Request, res: Response) => {
  const { filename } = req.params; // Get the filename from the URL
  const filePath = path.join(__dirname, "..", "uploads", filename); // Construct the file path

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Serve the file
    res.sendFile(filePath);
  } else {
    // Return a 404 error if the file doesn't exist
    res.status(404).json({ message: "File not found" });
  }
});

/* ROUTES */
app.get("/", (req, res) => {
  res.send("This is home route");
});

app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);

app.post("/api/users", (req, res) => {
  console.log(req.body);
  res.send(200);
})
// app.use("/search", searchRoutes);

/* SERVER */
const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on part ${port}`);
});