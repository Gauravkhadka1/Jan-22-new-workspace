import React, { useState, useEffect, useRef } from "react";
import { useGetProjectsQuery, useUpdateProjectStatusMutation } from "@/state/api";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EllipsisVertical, Plus, Calendar } from "lucide-react"; // Import Calendar icon
import { format, differenceInDays } from "date-fns"; // Import differenceInDays to calculate the difference
import Link from "next/link";

type BoardProps = {
  id: string;
  setIsModalNewProjectOpen: (isOpen: boolean) => void;
};

const projectStatus: Array<"New" | "Design" | "Development" | "Content-Fillup" | "Completed"> = [
  "New", "Design", "Development", "Content-Fillup", "Completed"
];

const ProjectBoardView = ({ id, setIsModalNewProjectOpen }: BoardProps) => {
  const { data: projects, isLoading, error, refetch } = useGetProjectsQuery({ projectId: Number(id) });
  const [updateProjectStatus] = useUpdateProjectStatusMutation();

  const moveProject = (projectId: number, toStatus: string) => {
    updateProjectStatus({ projectId, status: toStatus })
      .unwrap()
      .then(() => {
        // Refetch the projects after the update
        refetch();
      });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching projects.</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex p-4"> {/* Flex layout for the columns */}
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

  const color = statusColor[status];
  const projectCount = filteredProjects.length;

  return (
    <div
      ref={(node) => {
        drop(node); // Pass the node to react-dnd drop target
        if (typeof ref === "function") ref(node); // Allow the ref forwarding
      }}
      className="flex-1 w-1/5 h-[69vh] rounded-lg py-4 xl:px-2"  // Fixed width for equal distribution
    >
      <div className="mb-3 flex items-center justify-between bg-white dark:bg-dark-secondary p-4 rounded-md">
        <div className="flex items-center">
          <span className="block h-4 w-4 rounded-full" style={{ backgroundColor: color }}></span>
          <h3 className="ml-2 font-semibold text-sm">
            {status} ({projectCount}) {/* Display the project count */}
          </h3>
        </div>
        {/* <button
          className="rounded bg-gray-200 p-2 dark:bg-dark-tertiary"
          onClick={() => setIsModalNewProjectOpen(true)}
        >
          <Plus size={16} />
        </button> */}
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

  // Calculate the days remaining or overdue
  const currentDate = new Date();
  const endDate = new Date(projectData.endDate);
  const daysRemaining = differenceInDays(endDate, currentDate);
  const daysPast = differenceInDays(currentDate, endDate);

  // Determine the status text and color
  let statusText = "";
  let textColor = "";

  if (daysRemaining > 0) {
    statusText = `${daysRemaining} days remaining`;
    textColor = "#087641"; // Green color for remaining
  } else if (daysPast > 0) {
    statusText = `Overdue by ${daysPast} days`;
    textColor = "#b13a41"; // Red color for overdue
  }

  return (
    <div
      ref={dragRef} // Attach the drag ref here
      className={`mb-4 p-4 rounded-md shadow ${isDragging ? "opacity-50" : "opacity-100"} bg-white dark:bg-dark-secondary`}
    >
      <h4 className="font-bold text-sm break-words">
        <Link  href={`/projects/${projectData.id}`}>
        {projectData.name}
        </Link>
        </h4>
      <div className="flex-col py-2">
        <div className="flex items-center">
          <Calendar size={16} className="text-green-600" />
          <p className="ml-2 text-green-600">{formattedStartDate}</p>
        </div>
        <div className="flex items-center mt-2">
          <Calendar size={16} className="text-red-800" />
          <p className="ml-2 text-red-800">{formattedEndDate}</p>
        </div>
      </div>
      <p className="text-gray-600">
        {statusText && (
          <span style={{ color: textColor }} className="font-medium">
            {statusText}
          </span>
        )}
      </p>
    </div>
  );
};

export default ProjectBoardView;
