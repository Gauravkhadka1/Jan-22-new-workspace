import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO } from "date-fns";
import { ProspectsStatus } from "@/state/api";
import { setHours, setMinutes } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  useGetProspectsQuery,
  useCreateProspectsMutation,
  useUpdateProspectMutation,
  useGetUsersQuery,
} from "@/state/api";

type Prospects = {
  id: number;
  name: string;
  status: ProspectsStatus;
  category: string;
  inquiryDate?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  prospect?: Prospects | null; // Prospect data for editing
};

const ModalNewProspects = ({ isOpen, onClose, prospect = null }: Props) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [createProspects, { isLoading: isCreating }] = useCreateProspectsMutation();
  const [updateProspect, { isLoading: isUpdating }] = useUpdateProspectMutation();
  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();

  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProspectsStatus>(ProspectsStatus.New);
  const [category, setCategory] = useState("");
  const [inquiryDate, setInquiryDate] = useState<Date | null>(null);

  useEffect(() => {
    if (prospect) {
      setName(prospect.name || "");
      setStatus(prospect.status || ProspectsStatus.New);
      setCategory(prospect.category || "");
      setInquiryDate(prospect.inquiryDate ? new Date(prospect.inquiryDate) : null);
    } else {
      setName("");
      setStatus(ProspectsStatus.New);
      setCategory("");
      setInquiryDate(null);
    }
  }, [prospect]);

  const { refetch } = useGetProspectsQuery({}); 

  const handleSubmit = async () => {
    if (!name || !category) {
      toast.error("Name and category are required fields.");
      return;
    }

    const prospectsData = {
      name,
      status,
      category,
      inquiryDate: inquiryDate ? formatISO(inquiryDate, { representation: "complete" }) : undefined,
      updatedBy: userId, // Include the `updatedBy` field
    };

    try {
      if (prospect) {
        await updateProspect({
          prospectsId: prospect.id,
          ...prospectsData, // Pass all fields, including `updatedBy`
        }).unwrap();
        toast.success("Prospect updated successfully!");
      } else {
        await createProspects(prospectsData).unwrap();
        toast.success("Prospect created successfully!");
      }
      onClose();
    } catch (error) {
      toast.error("An error occurred while saving the prospect.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} name={prospect ? "Edit Prospect" : "Create New Prospect"}>
      <form
        className="mt-4 space-y-6 dark:text-gray-100"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-200"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select Category</option>
          <option value="ecommerce">Ecommerce</option>
          <option value="tourism">Tourism</option>
          <option value="education">Education</option>
          <option value="company">Company</option>
        </select>

        <div className="flex space-x-4">
          <DatePicker
            selected={inquiryDate}
            onChange={(date) => setInquiryDate(date)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholderText="Inquiry Date"
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
          {isCreating || isUpdating
            ? "Processing..."
            : prospect
            ? "Update Prospect"
            : "Create Prospect"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewProspects;