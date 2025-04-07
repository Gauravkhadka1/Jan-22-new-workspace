"use client";

import React, { useState } from "react";
import TaskHeader from "../../UserTaskHeader";
import Board from "../../UserTaskBoardView";
import ModalNewTask from "@/components/ModalNewandEditTask";
import { useAuth } from "../../../context/AuthContext"; // Import the custom hook
import { useGetTasksQuery, useGetTasksByUserQuery, useUpdateTaskStatusMutation, useCreateTaskMutation } from "@/state/api";
import { Clock } from "lucide-react";
import DashboardCalendarView from "../../DashboardCalendarUserView";
import withRoleAuth from "../../../hoc/withRoleAuth";
import { useParams, useSearchParams } from 'next/navigation'; // Use these hooks for App Router

type Props = {
  params: { id: string };
};

const Project = ({ params }: Props) => {
  const { id } = params;
  const searchParams = useSearchParams(); // Access query parameters
  const username = searchParams.get('username') ?? undefined; // Convert null to undefined

  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
  const { user } = useAuth(); // Assuming the hook returns the logged-in user
  const userId = user?.id; // Adjust this based on how your user data is structured
  const { data: tasks, isLoading, error } = useGetTasksByUserQuery(userId);

  return (
    <div>
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        id={id}
      />
      <TaskHeader activeTab={activeTab} setActiveTab={setActiveTab} username={username} />
      {activeTab === "Calendar" && (
        <DashboardCalendarView />
      )}
      {activeTab === "Board" && (
        <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
    </div>
  );
};

export default withRoleAuth(Project, ["ADMIN", "MANAGER"], ["12", "9", "8", "7"]);