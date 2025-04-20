import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  useGetTasksQuery,
  useGetTasksByUserQuery,
  useUpdateTaskStatusMutation,
  useCreateTaskMutation,
  useGetProjectsQuery,
  useDeleteTaskMutation,
} from "@/state/api";
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType, ProjectType } from "@/state/api";
import { ArrowRight, EllipsisVertical, MessageSquareMore, Plus } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import Image from "next/image";
import { toast } from "sonner"
import ModalNewTask from "@/components/ModalNewandEditTask";

type Status = "To Do" | "Work In Progress" | "Under Review" | "Completed";

type BoardProps = {
  id: string;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const taskStatus: Status[] = [
  "To Do",
  "Work In Progress",
  "Under Review",
  "Completed",
];

const Dashboard = ({ id, setIsModalNewTaskOpen }: BoardProps) => {
  const { user } = useAuth();
  const userId = user?.userId?.toString(); 
  const { 
    data: tasks, 
    isLoading, 
    error 
  } = useGetTasksByUserQuery(userId, {
    skip: !userId // Skip query if userId is not available
  });

  // Filter tasks for the current user
  const userTasks = tasks?.filter(task => 
    String(task.assignedTo) === String(userId)
  ) || [];

  const { data: projects } = useGetProjectsQuery({});

  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [createTask] = useCreateTaskMutation();

  useEffect(() => {
    console.log("User ID:", userId);
    if (tasks) {
      tasks.forEach((task) => {
        console.log("Task assignedTo:", task.assignedTo);
      });
    }
  }, [tasks, userId]);

  const moveTask = (taskId: number, toStatus: Status) => {
    if (!userId) {
      console.error("No authenticated user found");
      return;
    }

    updateTaskStatus({ taskId, status: toStatus, updatedBy: userId })
      .unwrap()
      .then(() => {
        toast.success(`Task status updated to ${toStatus}`);
      })
      .catch(() => {
        toast.error("Failed to update task status");
      });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching tasks</div>;

  const getProjectName = (projectId: number) => {
    const project = projects?.find((project) => project.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={userTasks}
            moveTask={moveTask}
            setIsModalNewTaskOpen={setIsModalNewTaskOpen}
            getProjectName={getProjectName}
          />
        ))}
      </div>
    </DndProvider>
  );
};

type TaskColumnProps = {
  status: Status;
  tasks: TaskType[];
  moveTask: (taskId: number, toStatus: Status) => void;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
  getProjectName: (projectId: number) => string;
};

const TaskColumn = ({
  status,
  tasks,
  moveTask,
  setIsModalNewTaskOpen,
  getProjectName,
}: TaskColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: number }) => moveTask(item.id, status),
    collect: (monitor: any) => ({
      isOver: !!monitor.isOver(),
    }),
  }));
  const tasksCount = tasks.filter((task) => task.status === status).length;

  const statusColor: Record<Status, string> = {
    "To Do": "#2563EB",
    "Work In Progress": "#F87645",
    "Under Review": "#9772EC",
    Completed: "#3DA44B",
  };

  return (
    <div
      ref={(instance) => {
        drop(instance);
      }}
      className={`sl:py-4 rounded-lg py-2 xl:px-2 ${isOver ? "bg-blue-100 dark:bg-neutral-950" : ""}`}
    >
      <div className="mb-3 flex w-full">
        <div
          className={`w-2 !bg-[${statusColor[status]}] rounded-s-lg`}
          style={{ backgroundColor: statusColor[status] }}
        />
        <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 dark:bg-dark-secondary">
          <h3 className="flex items-center text-sm font-semibold dark:text-gray-200">
            {status}{" "}
            <span
              className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
              style={{ width: "1.5rem", height: "1.5rem" }}
            >
              {tasksCount}
            </span>
          </h3>
          <div className="flex items-center gap-1">
            <button
              className="flex h-6 w-5 items-center justify-center dark:text-neutral-500"
            >
              {/* <EllipsisVertical size={26} /> */}
            </button>
            <button
              className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 dark:bg-dark-tertiary dark:text-white"
              onClick={() => setIsModalNewTaskOpen(true)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="h-[65vh] overflow-y-auto custom-scrollbar">
        {tasks
          .filter((task) => task.status === status)
          .map((task) => (
            <div key={task.id} className="relative">
              <Task key={task.id} task={task} getProjectName={getProjectName} />
            </div>
          ))}
      </div>
    </div>
  );
};

type TaskProps = {
  task: TaskType;
  getProjectName: (projectId: number) => string;
};

const Task = ({ task, getProjectName }: TaskProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id },
    collect: (monitor: any) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const taskTagsSplit = task.tags ? task.tags.split(",") : [];

  const formattedStartDate = task.startDate
    ? format(new Date(task.startDate), "MMM d, h:mm a")
    : "";

  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "MMM d, h:mm a")
    : "";

    const getTimeLeft = () => {
      if (
        !task.dueDate ||
        task.status === "Under Review" ||
        task.status === "Completed"
      )
        return null;
    
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
    
      if (diffMs < 0) {
        // Overdue
        const overdueMinutes = Math.abs(Math.floor(diffMs / (1000 * 60)));
        const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
        const overdueDays = Math.floor(overdueHours / 24);
        const overdueRemainingHours = overdueHours % 24;
    
        if (overdueMinutes < 60) {
          return {
            text: `${overdueMinutes} minute${overdueMinutes !== 1 ? "s" : ""} overdue`,
            color: "text-red-600 dark:text-red-500"
          };
        } else if (overdueHours < 24) {
          return {
            text: `${overdueHours} hour${overdueHours !== 1 ? "s" : ""} overdue`,
            color: "text-red-600 dark:text-red-500"
          };
        } else {
          return {
            text: `${overdueDays} day${overdueDays !== 1 ? "s" : ""} ${overdueRemainingHours} hour${overdueRemainingHours !== 1 ? "s" : ""} overdue`,
            color: "text-red-600 dark:text-red-500"
          };
        }
      } else {
        // Time left
        const minutesLeft = Math.floor(diffMs / (1000 * 60));
        const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
        const daysLeft = Math.floor(hoursLeft / 24);
        const remainingHours = hoursLeft % 24;
    
        if (minutesLeft < 60) {
          return {
            text: `${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""} left`,
            color: "text-green-600 dark:text-green-500"
          };
        } else if (hoursLeft < 24) {
          return {
            text: `${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} left`,
            color: "text-green-600 dark:text-green-500"
          };
        } else {
          return {
            text: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} ${remainingHours} hour${remainingHours !== 1 ? "s" : ""} left`,
            color: "text-green-600 dark:text-green-500"
          };
        }
      }
    };

  const timeLeft = getTimeLeft();

  const [taskOptionsVisible, setTaskOptionsVisible] = useState<
    Record<string | number, boolean>
  >({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const handleEditClick = (task: any) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (task: any) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(task.id).unwrap();
        toast.success("Task deleted successfully!");
      } catch (error) {
        console.error("Failed to delete the task:", error);
        toast.error("Failed to delete the task!");
      }
    }
  };

  const numberOfComments = (task.comments && task.comments.length) || 0;

  return (
    <div
      ref={(instance) => {
        drag(instance);
      }}
      className={`mb-4 rounded-md bg-white shadow dark:bg-dark-secondary ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      {task.attachments && task.attachments.length > 0 && (
        <Image
          src={`https://pm-s3-images.s3.us-east-2.amazonaws.com/${task.attachments[0].fileURL}`}
          alt={task.attachments[0].fileName}
          width={400}
          height={200}
          className="h-auto w-full rounded-t-md"
        />
      )}
      <div className="p-2 md:pt-1 md:pr-5 md:pl-5 md:pb-4 dark:border dark:border-gray-700 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="my-3 flex justify-between">
            <h4 className="text-md font-bold dark:text-gray-200">{task.title}</h4>
          </div>
          <button
            className="flex h-6 w-4 flex-shrink-0 items-center justify-center dark:text-neutral-500"
            onClick={(e) => {
              e.stopPropagation();
              setTaskOptionsVisible((prev) => ({
                ...prev,
                [task.id]: !prev[task.id],
              }));
            }}
          >
            <EllipsisVertical size={26} className="dark:text-gray-200"/>
          </button>
          {taskOptionsVisible[task.id] && (
            <div className="absolute right-10 mt-12 bg-white shadow-lg rounded z-50">
              <button
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(task);
                }}
              >
                Edit
              </button>
              <button
                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(task);
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
        <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          in {getProjectName(task.projectId)}
        </div>
        <div className="flex items-center mb-1 text-gray-500 dark:text-gray-400 text-xs">
        {formattedStartDate && <span>{formattedStartDate}</span>}
      <ArrowRight size={16} className="mx-2" />
          {formattedDueDate && <span>{formattedDueDate}</span>}
        </div>
        {timeLeft && (
          <div className={`mt-2 text-sm font-semibold ${timeLeft.color}`}>
            {timeLeft.text}
          </div>
        )}
        {isEditModalOpen && (
          <ModalNewTask
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            id={selectedTask?.projectId?.toString()}
            task={selectedTask}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;