"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

 // Get login function
const LoginForm = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Invalid credentials");
        setLoading(false);
        return;
      }
  
      const data = await response.json();
  
      // ✅ Pass token and user info to the login function
      login(data.token, data.user); 
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
        <img src="wtn-logo-black.svg" alt="" />
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          Login to Your Account
        </h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 mt-1 text-gray-900 bg-gray-100 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 mt-1 text-gray-900 bg-gray-100 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="Enter your password"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" className="w-4 h-4 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600" />
              <span className="ml-2">Remember Me</span>
            </label>
            {/* <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot Password?
            </Link> */}
          </div>

          {/* Login Button */}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        {/* Sign Up Redirect */}
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Don’t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
