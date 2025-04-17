"use client";

import React, { useState, useEffect } from "react";
import Board from "../BoardView";
import ModalNewTask from "@/components/ModalNewandEditTask";
import { useGetProjectsQuery } from "@/state/api";

type Props = {
  params: { id: string };
};

const Project = ({ params }: Props) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const { data: projectData, isLoading, error } = useGetProjectsQuery({ projectId: Number(id) });

  useEffect(() => {
    if (projectData && Array.isArray(projectData)) {
      // Find the project with the matching ID
      const project = projectData.find((project) => project.id === Number(id));
      if (project) {
        setProjectName(project.name);
      }
    }
  }, [projectData, id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching project data.</div>;

  return (
    <div>
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        id={id}
      />
      <div className="flex items-center text-lg mt-2 dark:text-gray-200">
      <h1 className="pl-6 pr-2 text-lg font-semibold ">{projectName}</h1> Task's
      </div>
      
      {activeTab === "Board" && (
        <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
    </div>
  );
};

export default Project;