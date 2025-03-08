"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDeleteUserMutation } from "@/state/api";
import {
  useGetTasksByUserQuery,
  useGetProjectsQuery,
  Task,
  Status,
} from "@/state/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const WORK_START_HOUR = 10; // 10 AM
const WORK_END_HOUR = 18; // 6 PM
const WORK_HOURS_PER_DAY = WORK_END_HOUR - WORK_START_HOUR; // 8 hours

// Define Nepali month start and end dates (Gregorian equivalents)
const NEPALI_MONTHS = {
  thisMonth: {
    startDate: "2025-02-13", // Start of Chaitra (Nepali month)
    endDate: "2025-03-13",   // End of Chaitra (Nepali month)
  },
  previousMonth: {
    startDate: "2025-01-13", // Start of Falgun (Nepali month)
    endDate: "2025-02-12",   // End of Falgun (Nepali month)
  },
};

// Define the TaskType type
type TaskType = {
  id: number;
  title: string;
  startDate?: string;
  dueDate?: string;
  projectId: number;
  status?: Status;
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [deleteUser] = useDeleteUserMutation();
  const { data: tasks, isLoading, isError } = useGetTasksByUserQuery(user?.id);
  const { data: projects } = useGetProjectsQuery({});

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeTab, setActiveTab] = useState("thisWeek"); // Default to "This Week"

  const projectMap = projects
    ? projects.reduce(
        (acc, project) => {
          acc[project.id] = project.name;
          return acc;
        },
        {} as Record<number, string>,
      )
    : {};

  // Function to calculate time spent on a task
  const calculateTimeSpent = (task: TaskType, allTasks: TaskType[]) => {
    let start = new Date(task.startDate!);
    const end = new Date(task.dueDate!);
    let totalMinutes = 0;

    while (start < end) {
      // Skip Saturdays
      if (start.getDay() === 6) {
        start.setDate(start.getDate() + 1);
        start.setHours(WORK_START_HOUR, 0, 0, 0);
        continue;
      }

      let workStart = new Date(start);
      workStart.setHours(WORK_START_HOUR, 0, 0, 0);
      let workEnd = new Date(start);
      workEnd.setHours(WORK_END_HOUR, 0, 0, 0);

      if (start < workStart) start = workStart;
      if (end < workStart) break;
      if (start > workEnd) {
        start.setDate(start.getDate() + 1);
        start.setHours(WORK_START_HOUR, 0, 0, 0);
        continue;
      }

      let effectiveEnd = end < workEnd ? end : workEnd;
      let taskDuration = (effectiveEnd.getTime() - start.getTime()) / (1000 * 60); // in minutes

      // Ensure no more than 8 hours (480 minutes) are counted per day
      taskDuration = Math.min(taskDuration, WORK_HOURS_PER_DAY * 60);

      totalMinutes += taskDuration;
      start.setDate(start.getDate() + 1);
      start.setHours(WORK_START_HOUR, 0, 0, 0);
    }

    // Convert total minutes to hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}.${minutes.toString().padStart(2, "0")}`;
  };

  // Function to check if a task is completed and within the selected date range
  const isCompletedAndWithinRange = (task: TaskType) => {
    if (task.status !== Status.Completed) return false;
    if (!task.startDate || !task.dueDate) return false;
    if (!fromDate || !toDate) return false;

    const taskStartDate = new Date(task.startDate);
    const taskDueDate = new Date(task.dueDate);
    const start = new Date(fromDate);
    const end = new Date(toDate);

    return (
      (taskStartDate >= start && taskStartDate <= end) ||
      (taskDueDate >= start && taskDueDate <= end)
    );
  };

  // Filter tasks based on the selected date range
  const filteredTasks =
    tasks?.filter((task) => isCompletedAndWithinRange(task)) ?? [];

  // Sort tasks by time spent (descending order)
  const sortedTasks = filteredTasks.slice().sort((a, b) => {
    const timeA = parseFloat(calculateTimeSpent(a, filteredTasks));
    const timeB = parseFloat(calculateTimeSpent(b, filteredTasks));
    return timeB - timeA;
  });

  // Calculate the number of days between the selected dates
  const calculateNumberOfDays = () => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include both start and end dates
  };

  // Calculate total working hours in the selected date range
  const calculateTotalWorkingHours = () => {
    if (!fromDate || !toDate) return 0;

    let start = new Date(fromDate);
    const end = new Date(toDate);
    let totalWorkingHours = 0;

    while (start <= end) {
      // Skip Saturdays
      if (start.getDay() === 6) {
        start.setDate(start.getDate() + 1);
        continue;
      }

      // Add 8 hours for each valid working day
      totalWorkingHours += WORK_HOURS_PER_DAY;
      start.setDate(start.getDate() + 1);
    }

    return totalWorkingHours;
  };

  // Calculate total time spent on tasks
  const calculateTotalTimeSpent = () => {
    return sortedTasks.reduce((total, task) => {
      const timeSpent = parseFloat(calculateTimeSpent(task, sortedTasks));
      return total + timeSpent;
    }, 0);
  };

  // Function to set the date range based on the selected tab
  const setDateRange = (tab: string) => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Start of the week (Sunday)
    const lastDayOfWeek = new Date(today);
    lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End of the week (Saturday)

    switch (tab) {
      case "previousMonth":
        setFromDate(NEPALI_MONTHS.previousMonth.startDate);
        setToDate(NEPALI_MONTHS.previousMonth.endDate);
        break;
      case "thisMonth":
        setFromDate(NEPALI_MONTHS.thisMonth.startDate);
        setToDate(NEPALI_MONTHS.thisMonth.endDate);
        break;
      case "thisWeek":
        setFromDate(firstDayOfWeek.toISOString().split("T")[0]);
        setToDate(lastDayOfWeek.toISOString().split("T")[0]);
        break;
      default:
        break;
    }
    setActiveTab(tab);
  };

  // Set default date range to this week on component mount
  useEffect(() => {
    setDateRange("thisWeek");
  }, []);

  // Data for the bar chart
  const chartData = [
    {
      name: "Total Working Hours",
      value: calculateTotalWorkingHours(),
    },
    {
      name: "Total Time Spent",
      value: calculateTotalTimeSpent(),
    },
  ];

  if (isLoading) return <p>Loading tasks...</p>;
  if (isError) return <p>Error loading tasks</p>;

  return (
    <div className="flex">
      <div className="flex min-h-screen ml-10 flex-col items-center mt-20 bg-gray-100 dark:bg-gray-900">
        <div className="w-80 rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-800">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Profile
          </h1>
          {user ? (
            <>
              <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
                Welcome, <span className="font-semibold">{user.username}</span>!
              </p>
              <button
                onClick={logout}
                className="mt-6 w-full rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:outline-none"
              >
                Logout
              </button>
            </>
          ) : (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              You are not logged in.
            </p>
          )}
        </div>

        <div className="mt-4 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <h2 className="mb-2 text-lg font-bold">Filter Tasks by Date Range</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setDateRange("previousMonth")}
              className={`px-4 py-2 rounded-lg ${
                activeTab === "previousMonth"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Previous Month
            </button>
            <button
              onClick={() => setDateRange("thisMonth")}
              className={`px-4 py-2 rounded-lg ${
                activeTab === "thisMonth"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange("thisWeek")}
              className={`px-4 py-2 rounded-lg ${
                activeTab === "thisWeek"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              This Week
            </button>
          </div>
          <div className="flex gap-4">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-md border p-2"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-md border p-2"
            />
          </div>
        </div>
      </div>
      <div className="mt-20 ml-20 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            Completed Tasks{" "}
            {fromDate && toDate ? (
              <span className="text-sm font-normal">
                ({fromDate} to {toDate}, {calculateNumberOfDays()} days)
              </span>
            ) : null}
          </h2>
        </div>
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="border p-2">SN</th>
              <th className="border p-2">Task Title</th>
              <th className="border p-2">Project Name</th>
              <th className="border p-2">Time Spent (Hours)</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks?.length > 0 ? (
              sortedTasks.map((task, index) => (
                <tr key={task.id} className="border">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2">{task.title}</td>
                  <td className="border p-2">
                    {projectMap?.[task.projectId] || "N/A"}
                  </td>
                  <td className="border p-2">
                    {task.startDate && task.dueDate
                      ? calculateTimeSpent(task, sortedTasks)
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="border p-2 text-center">
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Display total working hours and total time spent */}
        <div className="mt-6">
          <p className="text-lg font-bold">
            Total Working Hours: {calculateTotalWorkingHours()} hours
          </p>
          <p className="text-lg font-bold">
            Total Time Spent on Tasks: {calculateTotalTimeSpent().toFixed(2)} hours
          </p>
        </div>

        {/* Bar Chart */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-4">Visual Representation</h2>
          <BarChart width={500} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;