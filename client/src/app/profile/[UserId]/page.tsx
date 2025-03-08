"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useGetTasksByUserQuery,
  useGetProjectsQuery,
  Task,
  Status,
} from "@/state/api";

import { useParams, useSearchParams } from "next/navigation";
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
  const params = useParams();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

  // Convert userId from string to number
  const userId = parseInt(params.userId as string, 10);

  // Fetch tasks for the user
  const { data: tasks, isLoading, isError } = useGetTasksByUserQuery(userId);
  const { data: projects } = useGetProjectsQuery({});

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

  return (
    <div className="flex">
      <div className="flex min-h-screen ml-10 flex-col items-center mt-5 bg-gray-100 dark:bg-gray-900">
        {/* Bar Chart */}
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
          Welcome, <span className="font-semibold">{username}</span>!
        </p>
        </div>
      </div>
  );
};

export default ProfilePage;