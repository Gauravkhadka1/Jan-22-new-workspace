import React, { useState, useEffect, useRef } from "react";
import { useGetProjectsQuery, useUpdateProjectStatusMutation } from "@/state/api";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EllipsisVertical, Plus } from "lucide-react";
import { format } from "date-fns";

type BoardProps = {
  id: string;
  setIsModalNewProjectOpen: (isOpen: boolean) => void;
};

const projectStatus: Array<"New" | "Design" | "Development" | "Content-Fillup" | "Completed"> = [
  "New", "Design", "Development", "Content-Fillup", "Completed"
];

const ProjectBoardView = ({ id, setIsModalNewProjectOpen }: BoardProps) => {
  const { data: projects, isLoading, error } = useGetProjectsQuery({ projectId: Number(id) });
  const [updateProjectStatus] = useUpdateProjectStatusMutation();

  const moveProject = (projectId: number, toStatus: string) => {
    updateProjectStatus({ projectId, status: toStatus });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching projects.</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {projectStatus.map((status) => (
          <ProjectColumn
            key={status}
            status={status}
            projects={projects || []}
            moveProject={moveProject}
            setIsModalNewProjectOpen={setIsModalNewProjectOpen}
          />
        ))}
      </div>
    </DndProvider>
  );
};

type ProjectColumnProps = {
  status: "New" | "Design" | "Development" | "Content-Fillup" | "Completed";
  projects: any[]; // Change to appropriate type if available
  moveProject: (projectId: number, toStatus: string) => void;
  setIsModalNewProjectOpen: (isOpen: boolean) => void;
};

const ProjectColumn = React.forwardRef<HTMLDivElement, ProjectColumnProps>(({
  status,
  projects,
  moveProject,
  setIsModalNewProjectOpen,
}, ref) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "Project",
    drop: (item: { id: number }) => moveProject(item.id, status),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const filteredProjects = projects.filter((project) => project.status === status);
  const statusColor: Record<"New" | "Design" | "Development" | "Content-Fillup" | "Completed", string> = {
    New: "#2563EB",
    Design: "#059669",
    Development: "#D97706",
    "Content-Fillup": "#000000",
    Completed: "#000000",
  };

  // Use type assertion to tell TypeScript that 'status' will be one of the keys of 'statusColor'
  const color = statusColor[status];

  return (
    <div
      ref={(node) => {
        drop(node); // Pass the node to react-dnd drop target
        if (typeof ref === "function") ref(node); // Allow the ref forwarding
      }}
      className={`rounded-lg h-[70vh] py-4 xl:px-2 ${isOver ? "bg-blue-100 dark:bg-neutral-950" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between bg-white dark:bg-dark-secondary p-4 rounded-md">
        <div className="flex items-center">
          <span className="block h-4 w-4 rounded-full" style={{ backgroundColor: color }}></span>
          <h3 className="ml-2 font-semibold text-lg">{status}</h3>
        </div>
        <button
          className="rounded bg-gray-200 p-2 dark:bg-dark-tertiary"
          onClick={() => setIsModalNewProjectOpen(true)}
        >
          <Plus size={16} />
        </button>
      </div>
      {filteredProjects.map((project) => (
        <Project key={project.id} projectData={project} />
      ))}
    </div>
  );
});

type ProjectProps = {
  projectData: any; // Replace with appropriate type
};

const Project = ({ projectData }: ProjectProps) => {
  const dragRef = useRef(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "Project",
    item: { id: projectData.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Attach the drag source to the element ref
  drag(dragRef);

  const formattedStartDate = projectData.startDate
    ? format(new Date(projectData.startDate), "P")
    : "";
  const formattedEndDate = projectData.endDate ? format(new Date(projectData.endDate), "P") : "";

  return (
    <div
      ref={dragRef} // Attach the drag ref here
      className={`mb-4 p-4 rounded-md shadow ${isDragging ? "opacity-50" : "opacity-100"} bg-white dark:bg-dark-secondary`}
    >
      <h4 className="font-bold text-lg">{projectData.name}</h4>
      <p className="text-gray-500">{formattedStartDate} - {formattedEndDate}</p>
      <p className="text-gray-600">{projectData.description}</p>
    </div>
  );
};

export default ProjectBoardView;
