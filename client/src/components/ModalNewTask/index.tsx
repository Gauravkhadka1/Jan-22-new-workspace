import { useGetProjectsQuery, useCreateTaskMutation, useGetUsersQuery, useUpdateTaskMutation } from "@/state/api"; // Add useUpdateTaskMutation
import Modal from "@/components/Modal";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO } from "date-fns";
import { Status, Priority } from "@/state/api";
import { setHours } from "date-fns/setHours";
import { setMinutes } from "date-fns/setMinutes";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null; // Project ID
  task?: any; // Task data for editing
};

const ModalNewTask = ({ isOpen, onClose, id = null, task = null }: Props) => {
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation(); // Add mutation for updating tasks
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
  const [projectId, setProjectId] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const assignedBy = "test@test"; // Replace with actual user data if available

  // Prefill the form with task data when editing
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
      // Reset form when creating a new task
      setTitle("");
      setDescription("");
      setStatus(Status.ToDo);
      setPriority("Backlog");
      setTags("");
      setStartDate(null);
      setDueDate(null);
      setAssignedTo("");
      setProjectId("");
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!title || !assignedBy || !(id !== null || projectId) || !startDate || !dueDate) return;

    if (task) {
      // Update existing task
      await updateTask({
        taskId: task.id, // ✅ Ensure it matches the expected structure
        taskData: {
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
        },
      });
      
    } else {
      // Create new task
      await createTask({
        title,
        description,
        status: status as Status,
        priority: priority as Priority,
        tags,
        startDate: formatISO(startDate, { representation: "complete" }),
        dueDate: formatISO(dueDate, { representation: "complete" }),
        assignedTo,
        projectId: id !== null ? Number(id) : Number(projectId),
        assignedBy,
      });
    }
    onClose(); // Close the modal after submission
  };

  const filteredProjects = projects
    ?.filter((project) =>
      project.name.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal isOpen={isOpen} onClose={onClose} name={task ? "Edit Task" : "Create New Task"}>
      <form
        className="mt-4 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          type="text"
          className="w-full rounded border p-2 shadow-sm"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Project Selection Dropdown */}
        {id === null && !task && (
          <div>
            <div
              className="w-full rounded border p-2 cursor-pointer"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            >
              {projectId
                ? projects?.find((project) => project.id === Number(projectId))?.name || "Select a Project"
                : "Select a Project"}
            </div>

            {isProjectDropdownOpen && (
              <div className="mt-2">
                <input
                  type="text"
                  className="w-full rounded border p-2 mb-2"
                  placeholder="Search projects..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto">
                  {filteredProjects?.map((project) => (
                    <div
                      key={project.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
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
        )}

        {/* Assigned User Selection */}
        <select
          className="w-full rounded border p-2"
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
            className="w-full rounded border p-2"
            placeholderText="Start Date"
            minTime={setHours(setMinutes(new Date(), 0), 8)}
            maxTime={setHours(setMinutes(new Date(), 0), 19)}
          />

          <DatePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="w-full rounded border p-2"
            placeholderText="Due Date"
            minTime={setHours(setMinutes(new Date(), 0), 8)}
            maxTime={setHours(setMinutes(new Date(), 0), 19)}
          />
        </div>

        <button
          type="submit"
          className={`mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-white ${isCreating || isUpdating ? "cursor-not-allowed opacity-50" : ""}`}
          disabled={isCreating || isUpdating}
        >
          {isCreating || isUpdating ? "Processing..." : task ? "Update Task" : "Create Task"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;