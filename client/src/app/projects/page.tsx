"use client";

import React, { useState } from "react";
import ProjectHeader from "@/app/projects/ProjectHeader";
import Board from "./ProjectBoardView";
import ModalNewTask from "@/components/ModalNewTask";
import withRoleAuth from "../../hoc/withRoleAuth";

type Props = {
  params: { id: string };
};

const Project = ({ params }: Props) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

  return (
    <div>
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        id={id}
      />
      <ProjectHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "Board" && (
        <Board id={id} setIsModalNewProjectOpen={setIsModalNewTaskOpen} />
      )}
      
    </div>
  );
};

export default withRoleAuth(Project, ["ADMIN", "MANAGER"]);