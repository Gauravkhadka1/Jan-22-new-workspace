"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useGetTasksByUserIdForProfileQuery } from "@/state/api";

// Define the TaskType type
type TaskType = {
  id: number;
  title: string;
  startDate?: string;
  dueDate?: string;
  projectId: number;
  status?: string;
};

const ProfilePage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

  // Extract userId from the URL params
  const userId = parseInt(params.userId as string, 10);

  // Fetch tasks for the user
  const { data: tasks, isLoading, isError } = useGetTasksByUserIdForProfileQuery(userId);

  // Debugging: Log params and tasks
  console.log("params:", params);
  console.log("userId:", userId);
  console.log("tasks:", tasks);

  // Handle loading and error states
  if (isLoading) return <p>Loading tasks...</p>;
  if (isError) return <p>Error loading tasks</p>;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      {/* Welcome message */}
      <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
        Welcome, <span className="text-blue-500">{username}</span>!
      </h1>

      {/* List of tasks */}
      <div className="mt-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Your Tasks
        </h2>
        <ul className="space-y-3">
          {tasks?.map((task) => (
            <li
              key={task.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-800 dark:text-gray-200">
                  {task.title}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Project ID: {task.projectId}
                </span>
              </div>
              {task.startDate && task.dueDate && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <span>
                    {new Date(task.startDate).toLocaleDateString()} -{" "}
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {task.status && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Status: <span className="font-medium">{task.status}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProfilePage;