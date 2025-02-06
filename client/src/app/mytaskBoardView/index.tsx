import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; // Import the custom hook
import { useGetTasksQuery, useGetTasksByUserQuery, useUpdateTaskStatusMutation, useCreateTaskMutation } from "@/state/api";
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType } from "@/state/api";
import { EllipsisVertical, MessageSquareMore, Plus } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

type Status = "To Do" | "Work In Progress" | "Under Review" | "Completed";

type BoardProps = {
  id: string;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const taskStatus: Status[] = ["To Do", "Work In Progress", "Under Review", "Completed"];

const Dashboard = ({ id, setIsModalNewTaskOpen }: BoardProps) => {
  const { user } = useAuth(); // Assuming the hook returns the logged-in user
  const userId = user?.id; // Adjust this based on how your user data is structured
  const { data: tasks, isLoading, error } = useGetTasksByUserQuery(userId);
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


  // Move task and update its status
  const moveTask = (taskId: number, toStatus: Status) => {
    if (!userId) {
      console.error("No authenticated user found");
      return;
    }

    updateTaskStatus({ taskId, status: toStatus, updatedBy: userId });
  };
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching tasks</div>;

  // Filter tasks assigned to the logged-in user
  const userTasks = tasks?.filter((task) => String(task.assignedTo) === String(userId)) || [];




  return (
    <DndProvider backend={HTML5Backend}>
      <div className="mt-2 mx-6 text-xl font-medium">
      {user.username} Task's
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={userTasks}  // Pass only the filtered tasks
            moveTask={moveTask}
            setIsModalNewTaskOpen={setIsModalNewTaskOpen}
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
  };
  
  const TaskColumn = ({
    status,
    tasks,
    moveTask,
    setIsModalNewTaskOpen,
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
      "Work In Progress": "#059669",
      "Under Review": "#D97706",
      Completed: "#000000",
    };
     return (
        <div
          ref={(instance) => {
            drop(instance);
          }}
          className={`sl:py-4  rounded-lg py-2 xl:px-2 ${isOver ? "bg-blue-100 dark:bg-neutral-950" : ""}`}
        >
          <div className="mb-3 flex w-full">
            <div
              className={`w-2 !bg-[${statusColor[status]}] rounded-s-lg`}
              style={{ backgroundColor: statusColor[status] }}
            />
            <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 dark:bg-dark-secondary">
              <h3 className="flex items-center text-sm font-semibold dark:text-white">
                {status}{" "}
                <span
                  className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
                  style={{ width: "1.5rem", height: "1.5rem" }}
                >
                  {tasksCount}
                </span>
              </h3>
              <div className="flex items-center gap-1">
                <button className="flex h-6 w-5 items-center justify-center dark:text-neutral-500">
                  <EllipsisVertical size={26} />
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
    
          {tasks
            .filter((task) => task.status === status)
            .map((task) => (
              <Task key={task.id} task={task} />
            ))}
        </div>
      );
    };
    
    type TaskProps = {
      task: TaskType;
    };
    
    const Task = ({ task }: TaskProps) => {
      const [{ isDragging }, drag] = useDrag(() => ({
        type: "task",
        item: { id: task.id },
        collect: (monitor: any) => ({
          isDragging: !!monitor.isDragging(),
        }),
      }));
    
      const taskTagsSplit = task.tags ? task.tags.split(",") : [];
    
      const formattedStartDate = task.startDate
        ? format(new Date(task.startDate), "P")
        : "";
      const formattedDueDate = task.dueDate
        ? format(new Date(task.dueDate), "P")
        : "";

        // Calculate time left
        const getTimeLeft = () => {
          if (!task.dueDate) return null;
          
          const now = new Date();
          const dueDate = new Date(task.dueDate);
          const diffMs = dueDate.getTime() - now.getTime(); // Time difference in milliseconds
        
          const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
          const daysLeft = Math.floor(hoursLeft / 24);
          const remainingHours = hoursLeft % 24;
        
          if (diffMs < 0) {
            // Task is overdue
            const overdueHours = Math.abs(hoursLeft);
            const overdueDays = Math.floor(overdueHours / 24);
            const overdueRemainingHours = overdueHours % 24;
        
            return overdueHours < 24
              ? `${overdueHours} hour${overdueHours !== 1 ? "s" : ""} overdue`
              : `Overdue by ${overdueDays} day${overdueDays !== 1 ? "s" : ""} & ${overdueRemainingHours} hour${overdueRemainingHours !== 1 ? "s" : ""}`;
          }
        
          if (hoursLeft < 24) {
            return `${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} left`;
          } else {
            return `${daysLeft} day${daysLeft !== 1 ? "s" : ""} ${remainingHours} hour${remainingHours !== 1 ? "s" : ""} left`;
          }
        };
        

  const timeLeft = getTimeLeft();

    
      const numberOfComments = (task.comments && task.comments.length) || 0;
    
      const PriorityTag = ({ priority }: { priority: TaskType["priority"] }) => (
        <div
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            priority === "Urgent"
              ? "bg-red-200 text-red-700"
              : priority === "High"
              ? "bg-yellow-200 text-yellow-700"
              : priority === "Medium"
              ? "bg-green-200 text-green-700"
              : priority === "Low"
              ? "bg-blue-200 text-blue-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {priority}
        </div>
      );
    
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
          <div className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {task.priority && <PriorityTag priority={task.priority} />}
                <div className="flex gap-2">
                  {taskTagsSplit.map((tag) => (
                    <div
                      key={tag}
                      className="rounded-full bg-blue-100 px-2 py-1 text-xs"
                    >
                      {" "}
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <button className="flex h-6 w-4 flex-shrink-0 items-center justify-center dark:text-neutral-500">
                <EllipsisVertical size={26} />
              </button>
            </div>
    
            <div className="my-3 flex justify-between">
              <h4 className="text-md font-bold dark:text-white">{task.title}</h4>
            </div>
    
            <div className="text-xs text-gray-500 dark:text-neutral-500">
              {formattedStartDate && <span>{formattedStartDate} - </span>}
              {formattedDueDate && <span>{formattedDueDate}</span>}
            </div>
             {/* Show time left */}
        {timeLeft && (
          <div className="mt-2 text-sm font-semibold text-red-500">
            {timeLeft}
          </div>
        )}
          </div>
        </div>
      );
    };
    export default Dashboard;
    
    