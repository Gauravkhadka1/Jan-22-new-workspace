"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useGetProjectsQuery,
  useUpdateProjectStatusMutation,
  useDeleteProjectMutation,
  useUpdateProjectMutation,
  Task,
} from "@/state/api";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  EllipsisVertical,
  Plus,
  Calendar,
  Trash2,
  Edit,
  X,
  ArrowRight,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type BoardProps = {
  id: string;
  setIsModalNewProjectOpen: (isOpen: boolean) => void;
  projectName: string;
};

interface ProjectType {
  id: number;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  tasks?: Task[];
}

const projectStatus: Array<
  "New" | "Design" | "Development" | "Content-Fillup" | "Completed"
> = ["New", "Design", "Development", "Content-Fillup", "Completed"];

const ProjectBoardView = ({
  id,
  setIsModalNewProjectOpen,
  projectName,
}: BoardProps) => {
  const {
    data: projects = [],
    isLoading,
    error,
    refetch: refetchProjects,
  } = useGetProjectsQuery({ projectId: Number(id) });
  useEffect(() => {
    console.log("Projects data updated:", projects);
  }, [projects]);
  const [deleteProject] = useDeleteProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [updateProjectStatus] = useUpdateProjectStatusMutation();

  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectType | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Close dropdown when clicking outside
  const handleEditClick = (project: ProjectType) => {
    setCurrentProject(project);
    setEditFormData({
      name: project.name,
      description: project.description || "",
      startDate: project.startDate
        ? format(new Date(project.startDate), "yyyy-MM-dd")
        : "",
      endDate: project.endDate
        ? format(new Date(project.endDate), "yyyy-MM-dd")
        : "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (projectId: number) => {
    setProjectToDelete(projectId);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete).unwrap();
      toast.success("Project deleted successfully");
      refetchProjects();
    } catch (error) {
      toast.error("Failed to delete project");
    }

    setShowDeleteConfirm(false);
    setProjectToDelete(null);
  };

  // Handle edit form submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    try {
      await updateProject({
        projectId: currentProject.id,
        name: editFormData.name,
        description: editFormData.description,
        // Send dates as strings in YYYY-MM-DD format
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
      }).unwrap();
      toast.success("Project updated successfully");
      setIsEditModalOpen(false);
      refetchProjects();
    } catch (error) {
      toast.error("Failed to update project");
    }
  };

  const moveProject = (projectId: number, toStatus: string) => {
    updateProjectStatus({ projectId, status: toStatus })
      .unwrap()
      .then(() => {
        refetchProjects();
      });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching projects.</div>;

  return (
    <div className="p-4">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold">Delete Project</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3 text-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && currentProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 dark:border-gray-400 dark:bg-dark-secondary">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold dark:text-gray-200">
                Edit Project
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5 dark:text-gray-200" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Project Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-secondary dark:text-gray-200"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-secondary dark:text-gray-200"
                    value={editFormData.startDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-secondary dark:text-gray-200"
                    value={editFormData.endDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Update Project
              </Button>
            </form>
          </div>
        </div>
      )}

      <DndProvider backend={HTML5Backend}>
        <div className="flex p-4">
          <h2>{projectName}</h2>
          {projectStatus.map((status) => (
            <ProjectColumn
              key={status}
              status={status}
              projects={projects}
              moveProject={moveProject}
              setIsModalNewProjectOpen={setIsModalNewProjectOpen}
              handleEditClick={handleEditClick}
              handleDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      </DndProvider>
    </div>
  );
};

type ProjectColumnProps = {
  status: "New" | "Design" | "Development" | "Content-Fillup" | "Completed";
  projects: ProjectType[];
  moveProject: (projectId: number, toStatus: string) => void;
  setIsModalNewProjectOpen: (isOpen: boolean) => void;
  handleEditClick: (project: ProjectType) => void;
  handleDeleteClick: (projectId: number) => void;
};

const ProjectColumn = React.forwardRef<HTMLDivElement, ProjectColumnProps>(
  (
    {
      status,
      projects,
      moveProject,
      setIsModalNewProjectOpen,
      handleEditClick,
      handleDeleteClick,
    },
    ref,
  ) => {
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
          drop(node);
          if (typeof ref === "function") ref(node);
        }}
        className="-mt-10 h-[69vh] w-1/5 flex-1 rounded-lg py-4 xl:px-2"
      >
        <div className="mb-3 flex items-center justify-between rounded-md bg-white p-4 dark:bg-dark-secondary">
          <div className="flex items-center">
            <span
              className="block h-4 w-4 rounded-full"
              style={{ backgroundColor: color }}
            ></span>
            <h3 className="ml-2 text-sm font-semibold dark:text-gray-200">
              {status} ({projectCount})
            </h3>
          </div>
        </div>
        <div className="custom-scrollbar h-[65vh] overflow-y-auto">
          {filteredProjects.map((project) => (
            <Project
              key={project.id}
              projectData={project}
              handleEditClick={handleEditClick}
              handleDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      </div>
    );
  },
);

type ProjectProps = {
  projectData: ProjectType;
  handleEditClick: (project: ProjectType) => void;
  handleDeleteClick: (projectId: number) => void;
};

const Project = ({
  projectData,
  handleEditClick,
  handleDeleteClick,
}: ProjectProps) => {
  const dragRef = useRef(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "Project",
    item: { id: projectData.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  drag(dragRef);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formattedStartDate = projectData.startDate
    ? format(new Date(projectData.startDate), "MMM d, y")
    : "No start date";

  const formattedEndDate = projectData.endDate
    ? format(new Date(projectData.endDate), "MMM d, y")
    : "No end date";

  // Calculate days remaining/overdue only if we have both dates
  let statusText = "";
  let textColor = "";

  if (projectData.startDate && projectData.endDate) {
    const currentDate = new Date();
    const endDate = new Date(projectData.endDate);
    const daysRemaining = differenceInDays(endDate, currentDate);
    const daysPast = differenceInDays(currentDate, endDate);

    if (daysRemaining > 0) {
      statusText = `${daysRemaining} days remaining`;
      textColor = "text-green-600 dark:text-green-500";
    } else if (daysPast > 0) {
      statusText = `Overdue by ${daysPast} days`;
      textColor = "text-red-600 dark:text-red-500";
    }
  }

  const taskCount =
    projectData.tasks?.filter((task) => task.status !== "Completed").length ||
    0;
  // Determine text color based on task count
  const taskCountColor =
    taskCount === 0
      ? "text-red-600 dark:text-red-500"
      : "text-green-600 dark:text-green-600";

  if (projectData.status === "Completed") {
    return (
      <div
        ref={dragRef}
        className={`mb-4 rounded-md p-4 shadow ${isDragging ? "opacity-50" : "opacity-100"} bg-white dark:bg-dark-secondary`}
      >
        <h4 className="break-words text-sm font-bold dark:text-gray-200">
          <Link href={`/projects/${projectData.id}`}>{projectData.name}</Link>
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {taskCount} {taskCount === 1 ? "active task" : "active tasks"}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={dragRef}
      className={`mb-4 rounded-md p-4 shadow ${isDragging ? "opacity-50" : "opacity-100"} rounded-xl bg-white dark:border dark:border-gray-700 dark:bg-dark-secondary`}
    >
      <h4 className="flex items-center justify-between break-words text-sm font-bold dark:text-gray-200">
        <Link href={`/projects/${projectData.id}`}>{projectData.name}</Link>
        {isAdmin && (
          <div className="relative flex items-center" ref={dropdownRef}>
            <img
              src="/google-drive.png"
              alt="Project"
              className="h-4 w-4 mr-1 rounded-full"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="flex h-6 w-4 flex-shrink-0 items-center justify-center dark:text-gray-200"
            >
              <EllipsisVertical size={26} />
            </button>

            {isDropdownOpen && (
              <div className="w-15 absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-dark-tertiary">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(projectData);
                      setIsDropdownOpen(false);
                    }}
                    className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {/* Edit Project */}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(projectData.id);
                      setIsDropdownOpen(false);
                    }}
                    className="flex px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {/* Delete Project */}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </h4>

      <p className={`text-sm ${taskCountColor}`}>
        {taskCount} {taskCount === 1 ? "active task" : "active tasks"}
      </p>
      <div className="flex-col py-2">
        <div className="flex items-center">
          {/* <Calendar size={16} className="text-green-600 dark:text-gray-400" /> */}
          <p className="mr-1 text-xs text-green-600 dark:text-gray-400">
            {formattedStartDate}
          </p>
          <ArrowRight size={14} className="text-green-600 dark:text-gray-400" />
          <p className="ml-2 text-xs text-red-800 dark:text-gray-400">
            {formattedEndDate}
          </p>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300">
        {statusText && (
          <span className={`font-medium ${textColor}`}>{statusText}</span>
        )}
      </p>
    </div>
  );
};

export default ProjectBoardView;
