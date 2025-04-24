// client\src\components\ModalNewandEditTask\index.tsx

import { useGetProjectsQuery, useCreateTaskMutation, useGetUsersQuery, useUpdateTaskMutation, useAddCommentToTaskMutation } from "@/state/api";
import Modal from "@/components/Modal";
import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO, format } from "date-fns";
import { Status, Priority } from "@/state/api";
import { setHours } from "date-fns/setHours";
import { setMinutes } from "date-fns/setMinutes";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
  task?: any;
  onTaskCreatedOrUpdated?: () => void;
};

const ModalNewTask = ({ isOpen, onClose, id = null, task = null, onTaskCreatedOrUpdated }: Props) => {
  const { user } = useAuth();
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [addComment] = useAddCommentToTaskMutation();
  const { data: projects, isLoading: isProjectsLoading } = useGetProjectsQuery({});
  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState("Backlog");
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const assignedBy = user?.email || "";
  const [projectId, setProjectId] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  
  // New state for comment functionality
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [dateChangeComment, setDateChangeComment] = useState("");
  const [dateChanges, setDateChanges] = useState<{
    start?: { previous: Date | null; new: Date | null };
    due?: { previous: Date | null; new: Date | null };
  }>({});
  const formDataRef = useRef<any>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(Status.ToDo); 
      setPriority(task.priority || "Backlog");
      setTags(task.tags || "");
      setStartDate(task.startDate ? new Date(task.startDate) : null);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setAssignedTo(task.assignedTo || "");
      setProjectId(task.projectId?.toString() || "");
    } else {
      setTitle("");
      setDescription("");
      setStatus(Status.ToDo);
      setPriority("Backlog");
      setTags("");
      setStartDate(null);
      setDueDate(null);
      setAssignedTo("");
      setProjectId(id || "");
    }
  }, [task, id]);

  const checkForDateChanges = () => {
    if (!task) return false;

    const changes: typeof dateChanges = {};
    let hasChanges = false;

    if (startDate?.getTime() !== new Date(task.startDate).getTime()) {
      changes.start = {
        previous: task.startDate ? new Date(task.startDate) : null,
        new: startDate
      };
      hasChanges = true;
    }

    if (dueDate?.getTime() !== new Date(task.dueDate).getTime()) {
      changes.due = {
        previous: task.dueDate ? new Date(task.dueDate) : null,
        new: dueDate
      };
      hasChanges = true;
    }

    if (hasChanges) {
      setDateChanges(changes);
    }

    return hasChanges;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !assignedBy || !projectId || !startDate || !dueDate) return;

    if (task) {
         // Check for date changes
      const hasDateChanges = checkForDateChanges();
      
      if (hasDateChanges) {
        // Store form data in ref
        formDataRef.current = {
          title,
          description,
          status: Status.ToDo,
          priority,
          tags,
          startDate,
          dueDate,
          assignedTo,
          projectId,
          assignedBy
        };
        
        // Show comment modal instead of submitting
        setShowCommentModal(true);
        return;
      }
    }

    await submitTask();
  };

  const submitTask = async () => {
    const taskData = {
      title,
      description,
      status: status as Status,
      priority: priority as Priority,
      tags,
      startDate: formatISO(startDate!, { representation: "complete" }),
      dueDate: formatISO(dueDate!, { representation: "complete" }),
      assignedTo,
      projectId: Number(projectId),
      assignedBy,
    };

    try {
      if (task) {
        await updateTask({
          taskId: task.id,
          taskData,
        }).unwrap();
        toast.success("Task updated successfully!");
      } else {
        await createTask(taskData).unwrap();
        toast.success("Task created successfully!");
      }
      
      if (onTaskCreatedOrUpdated) {
        onTaskCreatedOrUpdated();
      }
      
      onClose();
    } catch (error) {
      toast.error("An error occurred while saving the task.");
    }
  };

  const confirmDateChange = async () => {
    if (!dateChangeComment.trim()) {
      toast.error("Please enter a reason for the date change");
      return;
    }

    // Add comments for each date change
    try {
      if (user?.userId && task?.id) {
        const comments: Promise<any>[] = [];
        
        if (dateChanges.start) {
          const commentContent = `${user.username || user.email} changed the start date from ${
            dateChanges.start.previous ? format(dateChanges.start.previous, "MMM d, yyyy hh:mm a") : "N/A"
          } to ${
            dateChanges.start.new ? format(dateChanges.start.new, "MMM d, yyyy hh:mm a") : "N/A"
          }\n\nReason: ${dateChangeComment}`;

          comments.push(
            addComment({
              taskId: task.id,
              content: commentContent,
              userId: Number(user.userId),
            }).unwrap()
          );
        }

        if (dateChanges.due) {
          const commentContent = `${user.username || user.email} changed the due date from ${
            dateChanges.due.previous ? format(dateChanges.due.previous, "MMM d, yyyy hh:mm a") : "N/A"
          } to ${
            dateChanges.due.new ? format(dateChanges.due.new, "MMM d, yyyy hh:mm a") : "N/A"
          }\n\nReason: ${dateChangeComment}`;

          comments.push(
            addComment({
              taskId: task.id,
              content: commentContent,
              userId: Number(user.userId),
            }).unwrap()
          );
        }

        await Promise.all(comments);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment for date change");
    }

    // Reset comment state
    setDateChangeComment("");
    setShowCommentModal(false);
    
    // Submit the form with the stored data
    if (formDataRef.current) {
      const {
        title, description, status, priority, tags,
        startDate, dueDate, assignedTo, projectId, assignedBy
      } = formDataRef.current;
      
      setTitle(title);
      setDescription(description);
      setStatus(status);
      setPriority(priority);
      setTags(tags);
      setStartDate(startDate);
      setDueDate(dueDate);
      setAssignedTo(assignedTo);
      setProjectId(projectId);
      
      formDataRef.current = null;
    }
    
    await submitTask();
  };

  const filteredProjects = projects
    ?.filter((project) =>
      project.name.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const formatDateForDisplay = (date: Date | null) => {
    return date ? format(date, "MMM d, yyyy hh:mm a") : "N/A";
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} name={task ? "Edit Task" : "Create New Task"}>
        <form
          className="mt-4 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pt-2 rounded-md"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="relative">
            <div
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            >
              {projectId
                ? projects?.find((project) => project.id === Number(projectId))?.name || "Select a Project"
                : "Select a Project"}
            </div>

            {isProjectDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                <input
                  type="text"
                  className="w-full rounded-t-md border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:outline-none"
                  placeholder="Search projects..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  {filteredProjects?.map((project) => (
                    <div
                      key={project.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer"
                      onClick={() => {
                        setProjectId(project.id.toString());
                        setIsProjectDropdownOpen(false);
                      }}
                    >
                      {project.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <select
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Assign To</option>
            {!isUsersLoading &&
              users?.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.username}
                </option>
              ))}
          </select>

          <div className="flex space-x-4">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              showTimeSelect
              dateFormat="yyyy-MM-dd HH:mm"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholderText="Start Date"
              minTime={setHours(setMinutes(new Date(), 0), 8)}
              maxTime={setHours(setMinutes(new Date(), 0), 19)}
            />
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              showTimeSelect
              dateFormat="yyyy-MM-dd HH:mm"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholderText="Due Date"
              minTime={setHours(setMinutes(new Date(), 0), 8)}
              maxTime={setHours(setMinutes(new Date(), 0), 19)}
            />
          </div>

          <button
            type="submit"
            className={`mt-4 w-full rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-white dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
              isCreating || isUpdating ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? "Processing..." : task ? "Update Task" : "Create Task"}
          </button>
        </form>
      </Modal>

      {/* Date Change Comment Modal */}
      {showCommentModal && (
        <Modal isOpen={showCommentModal} onClose={() => setShowCommentModal(false)} name="Date Change Reason">
          <div className="mt-4 space-y-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-md">
            <div className="space-y-4">
              <p className="font-semibold">You're updating the following dates:</p>
              
              {dateChanges.start && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-1 bg-blue-500 rounded-full h-full min-h-[40px]"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Previous Start Date
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {formatDateForDisplay(dateChanges.start.previous)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      New Start Date
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {formatDateForDisplay(dateChanges.start.new)}
                    </p>
                  </div>
                </div>
              )}
              
              {dateChanges.due && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-1 bg-blue-500 rounded-full h-full min-h-[40px]"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Previous Due Date
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {formatDateForDisplay(dateChanges.due.previous)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      New Due Date
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {formatDateForDisplay(dateChanges.due.new)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2 pt-4">
              <label htmlFor="dateChangeComment" className="block text-sm font-medium">
                Reason for change <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="dateChangeComment"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  rows={4}
                  value={dateChangeComment}
                  onChange={(e) => setDateChangeComment(e.target.value)}
                  placeholder="Please explain why you're changing these dates..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {dateChangeComment.length}/500
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setShowCommentModal(false);
                  setDateChangeComment("");
                  formDataRef.current = null;
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md text-white dark:text-gray-100 transition-colors ${
                  dateChangeComment.trim()
                    ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                }`}
                onClick={confirmDateChange}
                disabled={!dateChangeComment.trim()}
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ModalNewTask;