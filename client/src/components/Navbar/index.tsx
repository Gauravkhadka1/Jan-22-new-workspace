"use client";
import React from "react";
import { Menu, Moon, Search, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { 
  // setIsDarkMode,
   setIsSidebarCollapsed } from "@/state";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { user, logout } = useAuth();

  // Get current hour
  const currentHour = new Date().getHours();

  // Determine greeting based on time
  const getGreeting = () => {
    if (currentHour >= 0 && currentHour < 12) {
      return "Good Morning";
    } else if (currentHour >= 12 && currentHour < 18) {
      return "Good Afternoon";
    } else {
      return "Good Evening";
    }
  };

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 dark:bg-black dark:px-4 dark:py-3">
      <div className="flex items-center gap-8">
        {!isSidebarCollapsed ? null : (
          <button onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}>
            <Menu className="h-8 w-8 dark:text-gray-200" />
          </button>
        )}
        {isSidebarCollapsed ? null : (
          <button
            className="-mr-4 ml-2"
            onClick={() => {
              dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
            }}
          >
            <Menu className="h-8 w-8 dark:text-gray-200" />
          </button>
        )}

        <div className="relative flex h-min w-[200px]">
          <Search className="absolute left-[4px] top-1/2 mr-2 h-5 w-5 -translate-y-1/2 transform cursor-pointer dark:text-white" />
          <input
            className="w-full rounded border-none bg-gray-100 p-2 pl-8 placeholder-gray-500 focus:border-transparent focus:outline-none dark:bg-gray-700 dark:text-white dark:placeholder-white"
            type="search"
            placeholder="Search..."
          />
        </div>
      </div>

      <div className="flex items-center">
        {/* <button
          onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
          className={isDarkMode ? `rounded p-2 dark:hover:bg-gray-700` : `rounded p-2 hover:bg-gray-100`}
        >
          {isDarkMode ? <Sun className="h-6 w-6 cursor-pointer dark:text-white" /> : <Moon className="h-6 w-6 cursor-pointer dark:text-white" />}
        </button> */}

        {/* <div className="ml-2 mr-5 hidden min-h-[2em] w-[0.1rem] bg-gray-200 md:inline-block"></div> */}

        {user ? (
          <Link href="/profile" className="flex items-end text-sm font-medium text-blue-500 hover:underline dark:text-gray-200">
            {getGreeting()}, {user.username}
            <User className="ml-2 w-6  h-6"/>
          </Link>
        ) : (
          <button onClick={logout} className="text-sm font-medium text-red-500 hover:underline">
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;


