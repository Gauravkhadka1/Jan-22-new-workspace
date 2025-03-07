"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDeleteUserMutation } from "@/state/api";
import {
  useGetTasksByUserQuery,
  useGetProjectsQuery,
  Task,
  Status,
} from "@/state/api";

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
    ? projects.reduce(
        (acc, project) => {
          acc[project.id] = project.name;
          return acc;
        },
        {} as Record<number, string>,
      )
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

  const calculateTimeSpent = (task: TaskType, allTasks: TaskType[]) => {
    let start = new Date(task.startDate!);
    const end = new Date(task.dueDate!);
    let totalMinutes = 0;

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
      let taskDuration = (effectiveEnd.getTime() - start.getTime()) / (1000 * 60); // in minutes

      // Calculate overlapping time with other tasks
      let overlapMinutes = 0;
      allTasks.forEach((otherTask) => {
        if (otherTask.id !== task.id) {
          let otherStart = new Date(otherTask.startDate!);
          let otherEnd = new Date(otherTask.dueDate!);

          // Adjust other task's start and end to working hours
          otherStart.setHours(Math.max(otherStart.getHours(), WORK_START_HOUR), 0, 0, 0);
          otherEnd.setHours(Math.min(otherEnd.getHours(), WORK_END_HOUR), 0, 0, 0);

          if (otherStart < otherEnd) {
            // Find the intersection between the current task and the other task
            let overlapStart = new Date(Math.max(start.getTime(), otherStart.getTime()));
            let overlapEnd = new Date(Math.min(effectiveEnd.getTime(), otherEnd.getTime()));

            if (overlapStart < overlapEnd) {
              let overlappingTime = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60); // in minutes
              // Only subtract overlap if the current task is longer than the overlapping task
              if (taskDuration > overlappingTime) {
                overlapMinutes += overlappingTime;
              }
            }
          }
        }
      });

      // Ensure overlapMinutes does not exceed taskDuration
      overlapMinutes = Math.min(overlapMinutes, taskDuration);
      totalMinutes += taskDuration - overlapMinutes;

      start.setDate(start.getDate() + 1);
      start.setHours(WORK_START_HOUR, 0, 0, 0);
    }

    // Convert total minutes to hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}.${minutes.toString().padStart(2, "0")}`;
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

  const filteredTasks =
    tasks?.filter((task) => isCompletedAndWithinRange(task)) ?? [];

  // Sort tasks by time spent (descending order)
  const sortedTasks = filteredTasks.slice().sort((a, b) => {
    const timeA = parseFloat(calculateTimeSpent(a, filteredTasks));
    const timeB = parseFloat(calculateTimeSpent(b, filteredTasks));
    return timeB - timeA;
  });

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
        <h2 className="mb-4 text-lg font-bold">Completed Tasks</h2>
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
      </div>
    </div>
  );
};

export default ProfilePage;