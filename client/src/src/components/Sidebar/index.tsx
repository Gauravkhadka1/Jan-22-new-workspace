"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import { signOut } from "aws-amplify/auth";
import {
  FolderCode,
  Home,
  Users,
  LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext"; // Assuming you have useAuth to fetch user

const Sidebar = () => {
  const [showProjects, setShowProjects] = useState(true);
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode); // Access isDarkMode state

  const { user, loading } = useAuth(); // Fetching user info from context

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const sidebarClassNames = `fixed flex flex-col h-[100%] justify-between shadow-xl
    transition-all duration-300 h-full z-40 dark:bg-black overflow-y-auto bg-white
    ${isSidebarCollapsed ? "w-0 hidden" : "w-64"}`;

  // If loading or user data isn't available yet, show a loading state
  if (loading) return <div>Loading...</div>;

  // Check if the user has the correct role to display sidebar content
  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className={sidebarClassNames}>
      <div className="flex h-[100%] w-full flex-col justify-start">
        {/* TOP LOGO */}
        <div className="z-50 flex min-h-[56px] w-64 items-center justify-between bg-white px-6 pt-3 dark:bg-black">
          <Link href="/dashboard" className="text-sm font-medium text-blue-500 hover:underline">
            <div className="text-xl font-bold text-gray-800 dark:text-white">
              {/* Conditional rendering based on isDarkMode */}
              {isDarkMode ? (
                <Image src={"https://pm-s3-images-webtech.s3.us-east-1.amazonaws.com/wtn-logo-white.webp"} alt="logo" width={300} height={20} />
              ) : (
                <Image src={"https://pm-s3-images-webtech.s3.us-east-1.amazonaws.com/wtn-logo-black.svg"} alt="logo" width={300} height={20} />
              )}
            </div>
          </Link>
        </div>

        {/* NAVBAR LINKS */}
        <nav className="z-10 w-full mt-6 dark:text-gray-800">
          <SidebarLink icon={Home} label="Home" href="/dashboard" />
          {/* Conditionally render Projects and Teams links only if ADMIN or MANAGER */}
          {isAdminOrManager && (
            <>
              <SidebarLink icon={FolderCode} label="Projects" href="/projects" />
              <SidebarLink icon={Users} label="Teams" href="/users" />
            </>
          )}
          {isAdmin && (
            <>
              <SidebarLink icon={Users} label="Prospects" href="/prospects" />
              <SidebarLink icon={Users} label="Sales" href="/sales" />
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

const SidebarLink = ({ href, icon: Icon, label }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href} className="w-full">
      <div
        className={`relative flex cursor-pointer items-center gap-3 transition-colors hover:bg-gray-100 dark:bg-black dark:hover:bg-gray-700 ${
          isActive ? "bg-gray-100 text-white dark:bg-gray-600" : ""
        } justify-start px-8 py-3`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 h-[100%] w-[5px] bg-blue-200" />
        )}
        <Icon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
        <span className={`font-medium text-gray-800 dark:text-gray-200`}>
          {label}
        </span>
      </div>
    </Link>
  );
};

export default Sidebar;