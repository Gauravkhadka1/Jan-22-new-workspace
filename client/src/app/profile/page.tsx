"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDeleteUserMutation } from "@/state/api";
import { useGetTasksByUserQuery, useGetProjectsQuery, Task, Status } from "@/state/api";

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 19;
const WORK_HOURS_PER_DAY = WORK_END_HOUR - WORK_START_HOUR;

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [deleteUser] = useDeleteUserMutation();
  const { data: tasks, isLoading, isError } = useGetTasksByUserQuery(user?.id);
  const { data: projects } = useGetProjectsQuery({});

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const projectMap = projects
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
    status?: Status;
  };

  const calculateTimeSpent = (startDate: string, dueDate: string) => {
    let start = new Date(startDate);
    const end = new Date(dueDate);
    let totalHours = 0;

    while (start < end) {
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
      totalHours += (effectiveEnd.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      start.setDate(start.getDate() + 1);
      start.setHours(WORK_START_HOUR, 0, 0, 0);
    }
    return totalHours;
  };

  const isCompletedAndWithinRange = (task: TaskType) => {
    if (task.status !== Status.Completed) return false;
    if (!task.startDate || !task.dueDate) return false;
    if (!fromDate || !toDate) return true;

    const taskStartDate = new Date(task.startDate);
    const taskDueDate = new Date(task.dueDate);
    const start = new Date(fromDate);
    const end = new Date(toDate);

    return (
      (taskStartDate >= start && taskStartDate <= end) || 
      (taskDueDate >= start && taskDueDate <= end)
    );
  };

  const filteredTasks = tasks?.filter((task) => isCompletedAndWithinRange(task)) ?? [];

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

      <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg mt-4">
        <h2 className="text-lg font-bold mb-2">Filter Tasks by Date Range</h2>
        <div className="flex gap-4">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="p-2 border rounded-md" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="p-2 border rounded-md" />
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg mt-4">
        <h2 className="text-lg font-bold mb-4">Your Tasks</h2>
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
            {filteredTasks?.length > 0 ? (
              filteredTasks.map((task, index) => (
                <tr key={task.id} className="border">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2">{task.title}</td>
                  <td className="border p-2">{projectMap?.[task.projectId] || "N/A"}</td>
                  <td className="border p-2">{task.startDate && task.dueDate ? calculateTimeSpent(task.startDate, task.dueDate).toFixed(2) : "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="border p-2 text-center">No tasks found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfilePage;
