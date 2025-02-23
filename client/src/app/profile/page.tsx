"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useDeleteUserMutation } from "@/state/api";

const ProfilePage = () => {
  const { user, logout } = useAuth(); // Get user info & logout function
  const [deleteUser] = useDeleteUserMutation();

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
    </div>
  );
};

export default ProfilePage;
