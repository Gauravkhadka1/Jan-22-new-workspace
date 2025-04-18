import { useGetProjectsQuery, useCreateTaskMutation, useGetUsersQuery, useUpdateTaskMutation } from "@/state/api";
import Modal from "@/components/Modal";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO } from "date-fns";
import { Status, Priority } from "@/state/api";
import { setHours } from "date-fns/setHours";
import { setMinutes } from "date-fns/setMinutes";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null; // Project ID
  task?: any; // Task data for editing
  onTaskCreatedOrUpdated?: () => void; // Add this prop
};

const ModalNewTask = ({ isOpen, onClose, id = null, task = null, onTaskCreatedOrUpdated }: Props) => {
  const { user } = useAuth();
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
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

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || Status.ToDo);
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

  const handleSubmit = async () => {
    if (!title || !assignedBy || !projectId || !startDate || !dueDate) return;

    const taskData = {
      title,
      description,
      status: status as Status,
      priority: priority as Priority,
      tags,
      startDate: formatISO(startDate, { representation: "complete" }),
      dueDate: formatISO(dueDate, { representation: "complete" }),
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
      
      // Call the callback function to trigger refetch in parent component
      if (onTaskCreatedOrUpdated) {
        onTaskCreatedOrUpdated();
      }
      
      onClose();
    } catch (error) {
      toast.error("An error occurred while saving the task.");
    }
  };

  const filteredProjects = projects
    ?.filter((project) =>
      project.name.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal isOpen={isOpen} onClose={onClose} name={task ? "Edit Task" : "Create New Task"}>
      <form
        className="mt-4 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pt-2 rounded-md"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Status Selection */}
        <select
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-200"
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          <option value={Status.ToDo}>{Status.ToDo}</option>
          <option value={Status.WorkInProgress}>{Status.WorkInProgress}</option>
          <option value={Status.UnderReview}>{Status.UnderReview}</option>
          <option value={Status.Completed}>{Status.Completed}</option>
        </select>

        {/* Project Selection Dropdown */}
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

        {/* Assigned User Selection */}
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

        {/* Date Pickers */}
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
  );
};

export default ModalNewTask;