"use client";

import React, { useState } from "react";
import TaskHeader from "../TaskHeader";
import Board from "../DashboardBoardView";
import ModalNewTask from "@/components/ModalNewTask";
import { useAuth } from "../../context/AuthContext"; // Import the custom hook
import { useGetTasksQuery, useGetTasksByUserQuery, useUpdateTaskStatusMutation, useCreateTaskMutation } from "@/state/api";
import { Clock } from "lucide-react";
import DashboardCalendarView from "../DashboardCalendarView";
import withAuth from "../../hoc/withAuth";


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
     {activeTab === "Calendar" && (
        <DashboardCalendarView />
      )}
     {activeTab === "Board" && (
        <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
      {/* {activeTab === "Board" && (
        <CalendarView id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )} */}
    </div>
  );
};

export default withAuth(Project);