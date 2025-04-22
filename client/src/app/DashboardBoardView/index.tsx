import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  useGetTasksQuery,
  useGetTasksByUserQuery,
  useUpdateTaskStatusMutation,
  useCreateTaskMutation,
  useGetProjectsQuery,
  useDeleteTaskMutation,
  useAddCommentToTaskMutation,
} from "@/state/api";
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType, ProjectType, Comment } from "@/state/api";
import {
  Activity,
  ArrowRight,
  EllipsisVertical,
  MessageSquareMore,
  Plus,
  User,
} from "lucide-react";
import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";
import Image from "next/image";
import { toast } from "sonner";
import ModalNewTask from "@/components/ModalNewandEditTask";

type Status = "To Do" | "Work In Progress" | "Under Review" | "Completed";

type BoardProps = {
  id: string;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

interface ActivityLog {
  id: number;
  action: string;
  details: string | null;
  timestamp: string;
  userId: number;
  user?: {
    username?: string;
    // Add other user properties you might need
  };
}

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
    error,
  } = useGetTasksByUserQuery(userId, {
    skip: !userId, // Skip query if userId is not available
  });

  // Filter tasks for the current user
  const userTasks =
    tasks?.filter((task) => String(task.assignedTo) === String(userId)) || [];

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

    // Find the task being moved
    const taskToMove = userTasks.find((task) => task.id === taskId);
    if (!taskToMove) {
      toast.error("Task not found");
      return;
    }

    // Check if task is overdue
    const isOverdue =
      taskToMove.dueDate && new Date(taskToMove.dueDate) < new Date();

    // Special case: Allow moving from Under Review to Completed even if overdue
    const isUnderReviewToCompleted =
      taskToMove.status === "Under Review" && toStatus === "Completed";

    if (isOverdue && !isUnderReviewToCompleted) {
      toast.error("Task is overdue. Please edit the due date.");
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
    drop: (item: { id: number }) => {
      const task = tasks.find((t) => t.id === item.id);
      if (task) {
        moveTask(task.id, status);
      }
    },
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
      <div className="custom-scrollbar h-[65vh] overflow-y-auto">
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
  task: TaskType & {
    activityLogs?: ActivityLog[];
    comments?: Comment[];
  };
  getProjectName: (projectId: number) => string;
};

const Task = ({ task, getProjectName }: TaskProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id }, // We still only pass the ID for DnD compatibility
    collect: (monitor: any) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const taskTagsSplit = task.tags ? task.tags.split(",") : [];

  const [showCommentsPopup, setShowCommentsPopup] = useState(false);
  const [comments, setComments] = useState<Comment[]>(task.comments || []);
  const [newComment, setNewComment] = useState("");
  const [addCommentToTask] = useAddCommentToTaskMutation();
  const { user } = useAuth();

  useEffect(() => {
    if (task.comments) {
      setComments(task.comments);
    }
  }, [task.comments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      if (!user?.userId) {
        toast.error("You must be logged in to comment");
        return;
      }

      const response = await addCommentToTask({
        taskId: task.id,
        content: newComment,
        userId: Number(user.userId),
      }).unwrap();

      setComments([response, ...comments]); // Add new comment at the beginning
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    }
  };

  // Update the numberOfComments calculation
  const numberOfComments = comments.length;

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
          color: "text-red-600 dark:text-red-500",
        };
      } else if (overdueHours < 24) {
        return {
          text: `${overdueHours} hour${overdueHours !== 1 ? "s" : ""} overdue`,
          color: "text-red-600 dark:text-red-500",
        };
      } else {
        return {
          text: `${overdueDays} day${overdueDays !== 1 ? "s" : ""} ${overdueRemainingHours} hour${overdueRemainingHours !== 1 ? "s" : ""} overdue`,
          color: "text-red-600 dark:text-red-500",
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
          color: "text-green-600 dark:text-green-500",
        };
      } else if (hoursLeft < 24) {
        return {
          text: `${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} left`,
          color: "text-green-600 dark:text-green-500",
        };
      } else {
        return {
          text: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} ${remainingHours} hour${remainingHours !== 1 ? "s" : ""} left`,
          color: "text-green-600 dark:text-green-500",
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
  const [showActivityPopup, setShowActivityPopup] = useState(false);

  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const handleEditClick = (task: any) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close task options
      if (taskOptionsVisible[task.id]) {
        const optionsMenu = document.querySelector(".task-options-menu");
        if (optionsMenu && !optionsMenu.contains(event.target as Node)) {
          setTaskOptionsVisible((prev) => ({ ...prev, [task.id]: false }));
        }
      }

      // Close activity popup
      if (showActivityPopup) {
        const activityPopup = document.querySelector(".activity-popup");
        if (activityPopup && !activityPopup.contains(event.target as Node)) {
          setShowActivityPopup(false);
        }
      }

      // Close comments popup
      if (showCommentsPopup) {
        const commentsPopup = document.querySelector(".comments-popup");
        if (commentsPopup && !commentsPopup.contains(event.target as Node)) {
          setShowCommentsPopup(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [taskOptionsVisible, showActivityPopup, showCommentsPopup, task.id]);

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

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Plus size={16} className="text-blue-500" />;
      case "STATUS_UPDATE":
        return <Activity size={16} className="text-purple-500" />;
      case "DUE_DATE_UPDATE":
        return <ArrowRight size={16} className="text-orange-500" />;
      case "ASSIGNEE_UPDATE":
        return <User size={16} className="text-green-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  // const numberOfComments = (task.comments && task.comments.length) || 0;

  // Function to format activity log messages
  const formatActivityMessage = (log: ActivityLog) => {
    const { action, details, timestamp, user } = log;
    const formattedTime = format(new Date(timestamp), "MMM d, h:mm a");

    switch (action) {
      case "CREATE":
        return `${user?.username || "Someone"} created the task on ${formattedTime}`;
      case "STATUS_UPDATE":
        if (!details)
          return `${user?.username || "Someone"} updated the task status on ${formattedTime}`;
        const [fromStatus, toStatus] = details.split("|");
        return `${user?.username || "Someone"} updated status from ${fromStatus} to ${toStatus} on ${formattedTime}`;
      case "DUE_DATE_UPDATE":
        if (!details)
          return `${user?.username || "Someone"} updated the due date on ${formattedTime}`;
        const [oldDate, newDate] = details.split("|");
        return `${user?.username || "Someone"} changed due date from ${format(new Date(oldDate), "MMM d, h:mm a")} to ${format(new Date(newDate), "MMM d, h:mm a")} on ${formattedTime}`;
      case "ASSIGNEE_UPDATE":
        return `${user?.username || "Someone"} reassigned the task on ${formattedTime}`;
      default:
        return `${user?.username || "Someone"} modified the task on ${formattedTime}`;
    }
  };

  const parseDateChangeComment = (content: string) => {
    const lines = content.split('\n');
    const dateChangeMatch = lines[0].match(/(changed the (start|due) date from (.+) to (.+))/);
    
    if (dateChangeMatch) {
      const [_, changeText, dateType, oldDate, newDate] = dateChangeMatch;
      const reason = lines.slice(2).join('\n'); // Get everything after the first two lines as reason
      
      return {
        isDateChange: true,
        dateType,
        oldDate,
        newDate,
        reason,
        originalContent: content
      };
    }
    return { isDateChange: false, originalContent: content };
  };


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
      <div className="rounded-xl p-2 dark:border dark:border-gray-700 md:pb-4 md:pl-5 md:pr-5 md:pt-1">
        <div className="flex items-center justify-between">
          <div className="my-3 flex justify-between">
            <h4 className="text-md font-bold dark:text-gray-200">
              {task.title}
            </h4>
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
            <EllipsisVertical size={26} className="dark:text-gray-200" />
          </button>
          {taskOptionsVisible[task.id] && (
            <div className="task-options-menu absolute right-10 z-50 mt-12 rounded bg-white shadow-lg">
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
        <div className="mb-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
          {formattedStartDate && <span>{formattedStartDate}</span>}
          <ArrowRight size={16} className="mx-2" />
          {formattedDueDate && <span>{formattedDueDate}</span>}
        </div>
        {timeLeft && (
          <div className={`mt-2 text-sm font-semibold ${timeLeft.color}`}>
            {timeLeft.text}
          </div>
        )}
        <div className="my-3 border-b border-gray-500"></div>
        <div className="flex items-center justify-between dark:text-gray-200">
        {/* Activity Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActivityPopup(true);
          }}
          className="flex items-center rounded-md p-2 hover:bg-gray-100 dark:hover:bg-dark-tertiary"
        >
          <Activity size={18} className="mr-2 text-blue-500" />
          <span className="text-sm font-medium">
            {task.activityLogs?.length || 0}
          </span>
        </button>

        {/* Comments Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCommentsPopup(true);
          }}
          className="flex items-center rounded-md p-2 hover:bg-gray-100 dark:hover:bg-dark-tertiary"
        >
          <MessageSquareMore size={18} className="mr-2 text-green-500" />
          <span className="text-sm font-medium">{comments.length}</span>
        </button>
      </div>

      {/* Activity Modal */}
      {showActivityPopup && (
         <div 
         className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
         onClick={() => setShowActivityPopup(false)}
       >
           <div 
      className="relative max-h-[90vh] w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-dark-tertiary"
      onClick={(e) => e.stopPropagation()}
    >
            <div className="sticky top-0 rounded-t-lg bg-gray-50 px-6 py-4 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-semibold dark:text-gray-200">
                  Activity History
                </h4>
                <button
                  onClick={() => setShowActivityPopup(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {task.activityLogs && task.activityLogs.length > 0 ? (
                <div className="space-y-4">
                  {task.activityLogs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                        {getActivityIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium dark:text-gray-200">
                            {log.user?.username || "Anonymous"}
                          </p>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">
                          {formatActivityMessage(log)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity size={48} className="mb-4 text-gray-400" />
                  <p className="text-lg text-gray-500 dark:text-gray-400">
                    No activity yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsPopup && (
  <div 
  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
  onClick={() => setShowCommentsPopup(false)}
>
  <div 
    className="relative max-h-[90vh] w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-dark-tertiary"
    onClick={(e) => e.stopPropagation()}
  >
     <div className="sticky top-0 rounded-t-lg bg-gray-50 px-6 py-4 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold dark:text-gray-200">
            Comments
          </h4>
          <button
            onClick={() => setShowCommentsPopup(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-6">
        {comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => {
              const parsedComment = parseDateChangeComment(comment.content);
              
              return (
                <div
                  key={comment.id}
                  className="flex items-start gap-4 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                    <User size={24} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-medium dark:text-gray-200">
                        {comment.user?.username || "Anonymous"}
                      </p>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(
                          new Date(comment.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </div>
                    
                    {parsedComment.isDateChange ? (
                      <div className="mt-3 space-y-3">
                        <div className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-r">
                          <p className="text-gray-700 dark:text-gray-300">
                            {comment.user?.username || "Someone"} {parsedComment.dateType === 'due' ? 'changed the due date' : 'changed the start date'} from {parsedComment.oldDate} to {parsedComment.newDate}
                          </p>
                        </div>
                        {parsedComment.reason && (
                          <div className="mt-2 pl-2">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Reason:
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              {parsedComment.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-gray-600 dark:text-gray-300">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <MessageSquareMore size={48} className="mb-4 text-gray-400" />
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No comments yet
            </p>
          </div>
        )}
      </div>
            <div className="sticky bottom-0 border-t border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-dark-tertiary">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                  <User size={24} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-secondary dark:text-gray-200"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleAddComment}
                  className="rounded-lg bg-blue-500 px-6 py-3 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={!newComment.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {isEditModalOpen && (
        <ModalNewTask
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          id={selectedTask?.projectId?.toString()}
          task={selectedTask}
        />
      )}
    </div>
  );
};

export default Dashboard;
