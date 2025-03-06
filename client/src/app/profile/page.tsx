"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useDeleteUserMutation } from "@/state/api";
import { useGetTasksByUserQuery, useGetProjectsQuery } from "@/state/api";

const ProfilePage = () => {
  const { user, logout } = useAuth(); // Get user info & logout function
  const [deleteUser] = useDeleteUserMutation();

  
  const { data: tasks, isLoading, isError } = useGetTasksByUserQuery(user?.id);
  const { data: projects } = useGetProjectsQuery({});
  
  // Map project IDs to names for quick lookup
  const projectMap = projects?.reduce<Record<number, string>>((acc, project) => {
    acc[project.id] = project.name;
    return acc;
  }, {});
  

  if (isLoading) return <p>Loading tasks...</p>;
  if (isError) return <p>Error loading tasks</p>;

  const handleDelete = async () => {
    if (user && user.email) {
      try {
        await deleteUser(user.email).unwrap();
        alert("User deleted successfully");
        logout(); // Log out after deletion
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };
  

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
            {/* <button
              onClick={handleDelete}
              className="mt-4 w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 focus:outline-none"
            >
              Delete Account
            </button> */}
          </>
        ) : (
          <p className="mt-4 text-gray-600 dark:text-gray-400">You are not logged in.</p>
        )}
      </div>
      <div className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
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
          {tasks?.map((task, index) => (
            <tr key={task.id} className="border">
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2">{task.title}</td>
              <td className="border p-2">{projectMap?.[task.projectId] || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
    
  );
};

export default ProfilePage;



