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
import { ToastContainer } from "react-toastify"; // Import ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

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
      {/* Add ToastContainer here */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Modal for creating/editing tasks */}
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        id={id}
      />

      {/* Task header with tabs */}
      <TaskHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Render the appropriate view based on the active tab */}
      {activeTab === "Calendar" && <DashboardCalendarView />}
      {activeTab === "Board" && (
        <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
    </div>
  );
};

export default withAuth(Project);