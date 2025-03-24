import React, { useState, useEffect, useRef } from "react";
import {
  useGetProjectsQuery,
  useUpdateProjectStatusMutation,
} from "@/state/api";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EllipsisVertical, Plus, Calendar } from "lucide-react"; // Import Calendar icon
import { format, differenceInDays } from "date-fns"; // Import differenceInDays to calculate the difference
import Link from "next/link";

type BoardProps = {
  id: string;
  setIsModalNewProjectOpen: (isOpen: boolean) => void;
  projectName: string;
};

const projectStatus: Array<
  "New" | "Design" | "Development" | "Content-Fillup" | "Completed"
> = ["New", "Design", "Development", "Content-Fillup", "Completed"];

const ProjectBoardView = ({
  id,
  setIsModalNewProjectOpen,
  projectName,
}: BoardProps) => {
  const {
    data: projects,
    isLoading,
    error,
    refetch,
  } = useGetProjectsQuery({ projectId: Number(id) });
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
      <div className="flex p-4">
        {" "}
        {/* Flex layout for the columns */}
        <h2>{projectName}</h2>
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

const ProjectColumn = React.forwardRef<HTMLDivElement, ProjectColumnProps>(
  ({ status, projects, moveProject, setIsModalNewProjectOpen }, ref) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "Project",
      drop: (item: { id: number }) => moveProject(item.id, status),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }));

    const filteredProjects = projects.filter(
      (project) => project.status === status,
    );
    const statusColor: Record<
      "New" | "Design" | "Development" | "Content-Fillup" | "Completed",
      string
    > = {
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
        className="-mt-10 h-[69vh] w-1/5 flex-1 rounded-lg py-4 xl:px-2" // Fixed width for equal distribution
      >
        <div className="mb-3 flex items-center justify-between rounded-md bg-white p-4 dark:bg-dark-secondary">
          <div className="flex items-center">
            <span
              className="block h-4 w-4 rounded-full"
              style={{ backgroundColor: color }}
            ></span>
            <h3 className="ml-2 text-sm font-semibold dark:text-gray-200">
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
        <div className="custom-scrollbar h-[65vh] overflow-y-auto">
          {filteredProjects.map((project) => (
            <Project key={project.id} projectData={project} />
          ))}
        </div>
      </div>
    );
  },
);

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

  if (projectData.status === "Completed") {
    return (
      <div
        ref={dragRef}
        className={`mb-4 rounded-md p-4 shadow ${isDragging ? "opacity-50" : "opacity-100"} bg-white dark:bg-dark-secondary`}
      >
        <h4 className="break-words text-sm font-bold dark:text-gray-200">
          <Link href={`/projects/${projectData.id}`}>{projectData.name}</Link>
        </h4>
      </div>
    );
  }

  const formattedStartDate = projectData.startDate
    ? format(new Date(projectData.startDate), "MMM d, Y")
    : "";
  const formattedEndDate = projectData.endDate
    ? format(new Date(projectData.endDate), "MMM d, Y")
    : "";

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
    textColor = "text-green-600 dark:text-green-500"; // Green color for remaining
  } else if (daysPast > 0) {
    statusText = `Overdue by ${daysPast} days`;
    textColor = "text-red-600 dark:text-red-500"; // Red color for overdue
  }

  return (
    <div
      ref={dragRef} // Attach the drag ref here
      className={`mb-4 rounded-md p-4 shadow ${isDragging ? "opacity-50" : "opacity-100"} bg-white dark:bg-dark-secondary dark:border dark:border-gray-700 rounded-xl`}
    >
      <h4 className="flex items-center justify-between break-words text-sm font-bold dark:text-gray-200">
        <Link href={`/projects/${projectData.id}`}>{projectData.name}</Link>
          <button className="flex h-6 w-4 flex-shrink-0 items-center justify-center dark:text-gray-200">
            <EllipsisVertical size={26} />
          </button>
      </h4>
      <div className="flex-col py-2">
        <div className="flex items-center">
          <Calendar size={16} className="text-green-600 dark:text-gray-300" />
          <p className="ml-2 text-green-600 dark:text-gray-300">{formattedStartDate}</p>
        </div>
        <div className="mt-2 flex items-center">
          <Calendar size={16} className="text-red-800 dark:text-gray-300" />
          <p className="ml-2 text-red-800 dark:text-gray-300">{formattedEndDate}</p>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300">
        {statusText && (
          <span className={`font-medium ${textColor}`}>
            {statusText}
          </span>
        )}
      </p>
      {/* <div>
    no of TO DO tasks
   </div>
   <div>
   no of IN PROGRESS tasks
   </div>
   <div>
   no of UNDER REVIEW tasks
   </div>
   <div>
   no of COMPLETED tasks
   </div> */}
    </div>
  );
};

export default ProjectBoardView;