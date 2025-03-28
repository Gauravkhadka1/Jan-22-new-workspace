"use client";

import Header from "@/components/Header";
import {
  Calendar,
  Clock,
  Filter,
  Grid3x3,
  List,
  PlusSquare,
  Share2,
  Table,
} from "lucide-react";
import React, { useState } from "react";
import ModalNewProject from "./projects/ModalNewProject";
import { useAuth } from "../context/AuthContext";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

type Props = {
  activeTab: string;
  setActiveTab: (tabName: string) => void;
  username?: string;
};

const ProjectHeader = ({ activeTab, setActiveTab }: Props) => {
  const [isModalNewProjectOpen, setIsModalNewProjectOpen] = useState(false);
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

  // Extract userId from the URL params
  const userId = params.userId;

  // Debugging: Log username and userId
  console.log("username:", username);
  console.log("userId:", userId);

  return (
    <div className="px-4 xl:px-6">
      <ModalNewProject
        isOpen={isModalNewProjectOpen}
        onClose={() => setIsModalNewProjectOpen(false)}
      />

      {/* TABS */}
      <div className="flex flex-wrap-reverse gap-2 border-y border-gray-200 pb-[8px] pt-2 dark:border-stroke-dark md:items-center justify-between">
        <div className="flex text-lg font-medium items-center dark:text-gray-200">
          <div className="mx-2 text-lg font-medium">
            {username && userId ? (
              <Link
                href={{
                  pathname: `/profile/${userId}`,
                  query: { username },
                }}
                className="text-blue-500 hover:underline dark:text-gray-100"
              >
                {username} 
              </Link>
            ) : (
              "Tasks"
            )}
          </div>
          Task's
        </div>
        <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
          <TabButton
            name="Board"
            icon={<Grid3x3 className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
          <TabButton
            name="Calendar"
            icon={<Calendar className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
        </div>
      </div>
    </div>
  );
};

type TabButtonProps = {
  name: string;
  icon: React.ReactNode;
  setActiveTab: (tabName: string) => void;
  activeTab: string;
};

const TabButton = ({ name, icon, setActiveTab, activeTab }: TabButtonProps) => {
  const isActive = activeTab === name;

  return (
    <button
    className={`relative flex items-center gap-2 px-1 py-2 text-gray-500 after:absolute after:-bottom-[9px] after:left-0 after:h-[1px] after:w-full hover:text-blue-600 dark:text-gray-300 dark:hover:text-white sm:px-2 lg:px-4 ${
      isActive ? "text-blue-600 after:bg-blue-600 dark:text-white" : ""
    }`}
    onClick={() => setActiveTab(name)}
  >
      {icon}
      {name}
    </button>
  );
};

export default ProjectHeader;