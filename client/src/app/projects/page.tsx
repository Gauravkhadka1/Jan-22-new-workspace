"use client";

import React, { useState, useEffect } from "react";
import ProjectHeader from "@/app/projects/ProjectHeader";
import Board from "./ProjectBoardView";
import ModalNewTask from "@/components/ModalNewTask";
import withRoleAuth from "../../hoc/withRoleAuth";
import { useGetProjectsQuery } from "@/state/api"; // Assuming you have this hook

type Props = {
  params: { id: string };
};

const Project = ({ params }: Props) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  // Fetch project data
  const { data: projectData, isLoading, error } = useGetProjectsQuery({ projectId: Number(id) });

  // Set the project name when projectData is available
  useEffect(() => {
    if (projectData) {
      // If projectData is an array, find the project with the matching ID
      const project = Array.isArray(projectData) ? projectData.find((p) => p.id === Number(id)) : projectData;
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
      <ProjectHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "Board" && (
        <Board
          id={id}
          setIsModalNewProjectOpen={setIsModalNewTaskOpen}
          projectName={projectName} // Pass the projectName prop
        />
      )}
    </div>
  );
};

export default withRoleAuth(Project, ["ADMIN", "MANAGER"]);