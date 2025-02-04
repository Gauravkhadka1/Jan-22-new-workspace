import Modal from "@/components/Modal";
import {
  Priority,
  Status,
  useCreateTaskMutation,
  useGetUsersQuery,
} from "@/state/api";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO } from "date-fns";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
};

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState<Priority>(Priority.Backlog);
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [projectId, setProjectId] = useState("");

  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();

  // Directly set assignedBy to test@test
  const assignedBy = "test@test";

  const handleSubmit = async () => {
    if (!title || !assignedBy || !(id !== null || projectId) || !startDate || !dueDate) return;

    await createTask({
      title,
      description,
      status,
      priority,
      tags,
      startDate: formatISO(startDate, { representation: "complete" }),
      dueDate: formatISO(dueDate, { representation: "complete" }),
      assignedTo,
      projectId: id !== null ? Number(id) : Number(projectId),
      assignedBy, // Use test@test as assignedBy
    });
  };

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
        <select
          className="mb-4 block w-full rounded border px-3 py-2"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="">Assigned To</option>
          {!isUsersLoading &&
            users?.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.username}
              </option>
            ))}
        </select>
        
        <div className="flex align-center justify-start">
        <div className="mr-4">
            {/* Start Date Picker */}
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          showTimeSelect
          dateFormat="yyyy-MM-dd HH:mm"
          className="w-full rounded border p-2"
          placeholderText="Select Start Date"
        />
        </div>
        <div className="duedate">
 {/* Due Date Picker */}
 <DatePicker
          selected={dueDate}
          onChange={(date) => setDueDate(date)}
          showTimeSelect
          dateFormat="yyyy-MM-dd HH:mm"
          className="w-full rounded border p-2"
          placeholderText="Select Due Date"
        />
        </div>
        
        </div>

       

        {id === null && (
          <input
            type="text"
            className="w-full rounded border p-2"
            placeholder="ProjectId"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        )}
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
