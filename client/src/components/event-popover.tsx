import { useGetProjectsQuery, useCreateTaskMutation, useGetUsersQuery } from "@/state/api";
import Modal from "@/components/Modal";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO } from "date-fns";
import { Status, Priority } from "@/state/api"; 
import { setHours } from "date-fns/setHours";
import { setMinutes } from "date-fns/setMinutes";
import { useAuth } from "@/context/AuthContext";
import { toast } from 'react-toastify';


type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
};

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
  const { user } = useAuth(); // Get logged-in user from AuthContext
  const loggedInUserEmail = user?.email || ""; // Extract email
  const [createTask, { isLoading }] = useCreateTaskMutation();
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
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false); // Track if dropdown is open

  const assignedBy = loggedInUserEmail; 

  useEffect(() => {
    if (loggedInUserEmail) {
      setAssignedTo(loggedInUserEmail);
    }
  }, [loggedInUserEmail]);

  const handleSubmit = async () => {
    if (!title || !assignedBy || !(id !== null || projectId) || !startDate || !dueDate) return;

    try{
    const newTask = await createTask({
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
    }).unwrap();

    toast.success("Task created successfully!");

    // Close the modal after successful task creation
    onClose();
  } catch (error) {
    console.error("Error creating task:", error);
    // Error toast notification
    toast.error("Failed to create task. Please try again.");
  }
};

  // Filter and sort projects based on search keyword
  const filteredProjects = projects
    ?.filter((project) =>
      project.name.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Task">
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
        {id === null && (
          <div>
            <div
              className="w-full rounded border p-2 cursor-pointer"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            >
              {projectId ? (
                projects?.find((project) => project.id === Number(projectId))?.name || "Select a Project"
              ) : (
                "Select a Project"
              )}
            </div>

            {/* Search and Project List (Conditional Rendering) */}
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
                        setIsProjectDropdownOpen(false); // Close dropdown after selection
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
            minTime={setHours(setMinutes(new Date(), 0), 8)} // 10:00 AM
            maxTime={setHours(setMinutes(new Date(), 0), 19)} // 6:00 PM
          />

          <DatePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="w-full rounded border p-2"
            placeholderText="Due Date"
            minTime={setHours(setMinutes(new Date(), 0), 8)} // 10:00 AM
            maxTime={setHours(setMinutes(new Date(), 0), 19)} // 6:00 PM
          />
        </div>

        <button
          type="submit"
          className={`mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-white ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;