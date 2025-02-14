"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useGetTasksByUserQuery, useUpdateTaskStatusMutation } from "@/state/api";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EllipsisVertical, Plus } from "lucide-react";

type Status = "To Do" | "Work In Progress" | "Under Review" | "Completed";

const taskStatus: Status[] = ["To Do", "Work In Progress", "Under Review", "Completed"];

const UserTasks = () => {
  const params = useParams();
  const userId = params?.userId; 
  const userIdNumber = userId && !isNaN(Number(userId)) ? Number(userId) : null;
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

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
};

const TaskColumn = ({ status, tasks, moveTask, setIsModalNewTaskOpen }: TaskColumnProps) => {
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
    <div ref={(instance) => {
      drop(instance);
    }} className={`rounded-lg py-2 xl:px-2 ${isOver ? "bg-blue-100 dark:bg-neutral-950" : ""}`}>
      <div className="mb-3 flex w-full">
        <div className={`w-2`} style={{ backgroundColor: statusColor[status] }} />
        <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 dark:bg-dark-secondary">
          <h3 className="flex items-center text-lg font-semibold dark:text-white">
            {status}{" "}
            <span className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
              style={{ width: "1.5rem", height: "1.5rem" }}>
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

      {tasks.filter((task) => task.status === status).map((task) => (
        <div key={task.id} className="p-4 bg-white rounded-md shadow dark:bg-dark-secondary">
          <h4 className="text-md font-bold dark:text-white">{task.title}</h4>
          <p className="text-sm text-gray-600 dark:text-neutral-500">{task.description}</p>
        </div>
      ))}
    </div>
  );
};

export default UserTasks;
