"use client";

import React, { useState } from "react";
import TaskHeader from "@/app/projects/TaskHeader";
import Board from "../dashboardBoardView";
import ModalNewTask from "@/components/ModalNewTask";
import { useAuth } from "../../context/AuthContext"; // Import the custom hook
import { useGetTasksQuery, useGetTasksByUserQuery, useUpdateTaskStatusMutation, useCreateTaskMutation } from "@/state/api";


type Props = {
  params: { id: string };
};

const Project = ({ params }: Props) => {
  const { id } = params;
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
     <TaskHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "Board" && (
        <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
    </div>
  );
};

export default Project;