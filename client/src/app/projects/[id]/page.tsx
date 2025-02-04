"use client";

import React, { useState } from "react";
import ProjectHeader from "@/app/projects/ProjectHeader";
import Board from "../BoardView";
import ModalNewTask from "@/components/ModalNewTask";

import { useGetProjectsQuery } from "@/state/api";

type Props = {
  params: { id: string };
};

const Project = ({ params }: Props) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
// Fetch projects data
const { data: projects, isLoading } = useGetProjectsQuery({});


// Find the current project by id
const project = projects?.find((p) => String(p.id) === String(id));

if (isLoading) return <p>Loading...</p>;
if (!project) return <p>Project not found</p>;
  return (
    <div>
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        id={id}
      />
     
      <h1 className="ml-6 font-medium text-xl">{project.name} Task's</h1> 
      {activeTab === "Board" && (
        <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
    </div>
  );
};

export default Project;