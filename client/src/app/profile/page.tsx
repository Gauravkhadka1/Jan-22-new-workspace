"use client"

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDeleteUserMutation } from "@/state/api";
import { useGetTasksByUserQuery, useGetProjectsQuery, Task, Status } from "@/state/api";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [deleteUser] = useDeleteUserMutation();
  const { data: tasks, isLoading, isError } = useGetTasksByUserQuery(user?.id);
  const { data: projects } = useGetProjectsQuery({});

  // State for date range selection
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Map project IDs to names
  const projectMap: Record<number, string> = projects
    ? projects.reduce((acc, project) => {
        acc[project.id] = project.name;
        return acc;
      }, {} as Record<number, string>)
    : {};

  if (isLoading) return <p>Loading tasks...</p>;
  if (isError) return <p>Error loading tasks</p>;

  type TaskType = {
    id: number;
    title: string;
    startDate?: string;
    dueDate?: string;
    projectId: number;
    status?: Status; // Make status optional to match the Task type
  };

  const isCompletedAndWithinRange = (task: TaskType) => {
    // Check if the task is completed and status is defined
    if (task.status !== Status.Completed) return false;

    // Proceed with date range filtering
    if (!task.startDate || !task.dueDate) return false; // Handle undefined dates
    if (!fromDate || !toDate) return true; // No filtering if dates are not selected

    const taskStartDate = new Date(task.startDate);
    const taskDueDate = new Date(task.dueDate);
    const start = new Date(fromDate);
    const end = new Date(toDate);

    return (
      (taskStartDate >= start && taskStartDate <= end) || 
      (taskDueDate >= start && taskDueDate <= end)
    );
  };

  // Filtering tasks based on the date range
  const filteredTasks = tasks?.filter((task) => isCompletedAndWithinRange(task)) ?? [];
  const colSpanValue = 2;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg w-80 text-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Profile</h1>
        {user ? (
          <>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
              Welcome, <span className="font-semibold">{user.username}</span>!
            </p>
            <button
              onClick={logout}
              className="mt-6 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none"
            >
              Logout
            </button>
          </>
        ) : (
          <p className="mt-4 text-gray-600 dark:text-gray-400">You are not logged in.</p>
        )}
      </div>

      {/* Date Range Filters */}
      <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg mt-4">
        <h2 className="text-lg font-bold mb-2">Filter Tasks by Date Range</h2>
        <div className="flex gap-4">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2 border rounded-md"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2 border rounded-md"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg mt-4">
        <h2 className="text-lg font-bold mb-4">Your Tasks</h2>
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="border p-2">SN</th>
              <th className="border p-2">Task Title</th>
              <th className="border p-2">Project Name</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks?.length > 0 ? (
              filteredTasks.map((task, index) => (
                <tr key={task.id} className="border">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2">{task.title}</td>
                  <td className="border p-2">{projectMap?.[task.projectId] || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={colSpanValue}>No tasks found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfilePage;
