"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useGetTasksByUserQuery, useUpdateTaskStatusMutation, useGetProjectsQuery } from "@/state/api";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EllipsisVertical, Plus } from "lucide-react";
import { format } from "date-fns";

type Status = "To Do" | "Work In Progress" | "Under Review" | "Completed";

type BoardProps = {
  id: string;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
};


const taskStatus: Status[] = ["To Do", "Work In Progress", "Under Review", "Completed"];

const UserTasks = ({ id, setIsModalNewTaskOpen }: BoardProps) => {
  const params = useParams();
  const userId = params?.userId; 
  const userIdNumber = userId && !isNaN(Number(userId)) ? Number(userId) : null;


  const { data: projects } = useGetProjectsQuery({});

  if (!userIdNumber) {
    return <div>Invalid User ID</div>;
  }

  const { data: tasks, isLoading, error } = useGetTasksByUserQuery(userIdNumber);
  const [updateTaskStatus] = useUpdateTaskStatusMutation();

  useEffect(() => {
    console.log("User ID from URL:", userIdNumber);
    if (tasks) {
      tasks.forEach((task) => {
        console.log("Task assignedTo:", task.assignedTo);
      });
    }
  }, [tasks, userIdNumber]);

  const moveTask = (taskId: number, toStatus: Status) => {
    // updateTaskStatus({ taskId, status: toStatus });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching tasks</div>;

  const userTasks = tasks?.filter((task) => String(task.assignedTo) === String(userIdNumber)) || [];

  // Function to get project name by projectId
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
            getProjectName={getProjectName} // Pass the function down
          />
        ))}
      </div>
    </DndProvider>
  );
};

type TaskColumnProps = {
  status: Status;
  tasks: any[];
  moveTask: (taskId: number, toStatus: Status) => void;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
  getProjectName: (projectId: number) => string; // Add this to pass project name function
};

const TaskColumn = ({ status, tasks, moveTask, setIsModalNewTaskOpen, getProjectName }: TaskColumnProps) => {
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

  // Helper function to calculate time remaining
  const getTimeRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    
    if (diffMs < 0) {
      // Overdue
      const overdueMinutes = Math.abs(Math.floor(diffMs / (1000 * 60)));
      const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      const overdueDays = Math.floor(overdueHours / 24);
      const overdueRemainingHours = overdueHours % 24;
  
      if (overdueMinutes < 60) {
        return {
          text: `${overdueMinutes} minute${overdueMinutes !== 1 ? 's' : ''} overdue`,
          color: 'text-red-600 dark:text-red-500'
        };
      } else if (overdueHours < 24) {
        return {
          text: `${overdueHours} hour${overdueHours !== 1 ? 's' : ''} overdue`,
          color: 'text-red-600 dark:text-red-500'
        };
      } else {
        return {
          text: `${overdueDays} day${overdueDays !== 1 ? 's' : ''} ${overdueRemainingHours} hour${overdueRemainingHours !== 1 ? 's' : ''} overdue`,
          color: 'text-red-600 dark:text-red-500'
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
          text: `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} left`,
          color: 'text-green-600 dark:text-green-500'
        };
      } else if (hoursLeft < 24) {
        return {
          text: `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`,
          color: 'text-green-600 dark:text-green-500'
        };
      } else {
        return {
          text: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''} left`,
          color: 'text-green-600 dark:text-green-500'
        };
      }
    }
  };

  // Determine if task is overdue
  const isOverdue = (dueDate: string) => new Date(dueDate).getTime() < new Date().getTime();

  return drop(
    <div className={`rounded-lg py-2 xl:px-2  ${isOver ? "bg-blue-100 dark:bg-neutral-950" : ""}`}>
      <div className="mb-3 flex w-full">
        <div className={`w-2 rounded-s-lg` } style={{ backgroundColor: statusColor[status] } } />
        <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 dark:bg-dark-secondary">
          <h3 className="flex items-center text-sm font-semibold dark:text-white">
            {status}{" "}
            <span className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
              style={{ width: "1.5rem", height: "1.5rem" }}>
              {tasksCount}
            </span>
          </h3>
          <div className="flex items-center gap-1">
            <button className="flex h-6 w-5 items-center justify-center dark:text-neutral-500">
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

      {tasks.filter((task) => task.status === status).map((task) => (
        <div key={task.id} className="p-4 mb-4 bg-white rounded-md shadow dark:bg-dark-secondary dark:border dark:border-gray-700 rounded-xl">
          <h4 className="text-md font-bold dark:text-white">{task.title}</h4>
          <div className="mb-2 mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">in {getProjectName(task.projectId)}</div>
          <p className="text-sm mb-1 text-gray-500 dark:text-gray-400">
            <b>Start: </b>{format(new Date(task.startDate), 'MMM d, hh:mm a')} 
          </p>
          <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">
          <b>Due:</b> {format(new Date(task.dueDate), 'MMM d, hh:mm a')}
          </p>
          {task.status !== "Under Review" && task.status !== "Completed" && (
  <p className={`text-sm font-semibold ${getTimeRemaining(task.dueDate).color}`}>
    {getTimeRemaining(task.dueDate).text}
  </p>
)}
 </div>

       
      ))}
    </div>
    </div>
  );
};

export default UserTasks;