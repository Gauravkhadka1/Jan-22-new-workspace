import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  useUpdateProspectMutation,
  useCreateProspectsMutation,
  useGetProspectsQuery,
  useDeleteProspectsMutation,
} from "@/state/api";
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { CalendarSearch, ChartBarStacked, EllipsisVertical, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ModalNewProspects from "@/components/ModalNewandEditProspects";
import { ProspectsStatus, Prospects } from "@/state/api"; // Import Prospects type and ProspectsStatus

type BoardProps = {
  id: string;
  setIsModalNewProspectsOpen: (isOpen: boolean) => void;
};

const prospectsStatus: ProspectsStatus[] = [
  ProspectsStatus.New,
  ProspectsStatus.Dealing,
  ProspectsStatus.QuoteSent,
  ProspectsStatus.AgreementSent,
  ProspectsStatus.Converted,
];

type ProspectsType = {
  id: number;
  name: string;
  status: ProspectsStatus; // Use the imported Status type
  category: string;
  inquiryDate?: string;
};

const ProspectsBoardView = ({ id, setIsModalNewProspectsOpen }: BoardProps) => {
  const { user } = useAuth();
  const userId = user?.id;
  const {
    data: prospectsData,
    isLoading,
    error,
    refetch,
  } = useGetProspectsQuery({});

  // Refetch prospects data whenever a mutation occurs
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Cast the `status` property to the `Status` type
  const prospects =
    prospectsData?.map((prospect) => ({
      ...prospect,
      status: prospect.status as ProspectsStatus, // Cast the status to the `Status` type
    })) || [];

  const [createProspect] = useCreateProspectsMutation();

  const handleCreateProspect = async (prospectData: Partial<Prospects>) => {
    try {
      await createProspect(prospectData).unwrap();
      toast.success("Prospect created successfully!");
    } catch (error) {
      toast.error("Failed to create prospect!");
    }
  };

  const [updateProspect] = useUpdateProspectMutation();

  const handleEditProspect = async (
    prospectId: number,
    prospectData: Partial<Prospects>,
  ) => {
    try {
      await updateProspect({
        prospectsId: prospectId,
        ...prospectData,
        updatedBy: user?.id, // Ensure `updatedBy` is passed
      }).unwrap();
      toast.success("Prospect updated successfully!");
    } catch (error) {
      toast.error("Failed to update prospect!");
    }
  };

  const [deleteProspect] = useDeleteProspectsMutation();

  const handleDeleteProspect = async (prospectId: number) => {
    try {
      await deleteProspect(prospectId).unwrap();
      toast.success("Prospect deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete prospect!");
    }
  };

  // In client/src/app/ProspectsBoardView/index.tsx
const moveProspects = (prospectsId: number, toStatus: ProspectsStatus) => {
  if (!userId) {
    console.error("No authenticated user found");
    return;
  }

  // Find the prospect being moved
  const prospect = prospects.find((p) => p.id === prospectsId);
  if (!prospect) {
    console.error("Prospect not found");
    return;
  }

  // Send all fields, updating only the status
  updateProspect({
    prospectsId,
    name: prospect.name,
    status: toStatus,
    category: prospect.category,
    inquiryDate: prospect.inquiryDate,
    updatedBy: userId,
  })
    .unwrap()
    .then(() => {
      toast.success(`Prospect status updated to ${toStatus}`);
    })
    .catch(() => {
      toast.error("Failed to update prospect status");
    });
};

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching prospects</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
        {prospectsStatus.map((status) => (
          <ProspectsColumn
            key={status}
            status={status}
            prospects={prospects}
            moveProspects={moveProspects}
            setIsModalNewProspectsOpen={setIsModalNewProspectsOpen}
          />
        ))}
      </div>
    </DndProvider>
  );
};

type ProspectsColumnProps = {
  status: ProspectsStatus; // Use the ProspectsStatus enum
  prospects: ProspectsType[];
  moveProspects: (prospectId: number, toStatus: ProspectsStatus) => void;
  setIsModalNewProspectsOpen: (isOpen: boolean) => void;
};

const ProspectsColumn = React.forwardRef<HTMLDivElement, ProspectsColumnProps>(
  ({ status, prospects, moveProspects, setIsModalNewProspectsOpen }, ref) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "prospect",
      drop: (item: { id: number }) => moveProspects(item.id, status),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));

    const prospectsCount = prospects.filter(
      (prospect) => prospect.status === status,
    ).length;

    const statusColor: Record<ProspectsStatus, string> = {
      [ProspectsStatus.New]: "#2563EB",
      [ProspectsStatus.Dealing]: "#F87645",
      [ProspectsStatus.QuoteSent]: "#9772EC",
      [ProspectsStatus.AgreementSent]: "#9772EC",
      [ProspectsStatus.Converted]: "#3DA44B",
    };

    return (
      <div
        ref={(node) => {
          drop(node); // Pass the node to react-dnd drop target
          if (typeof ref === "function") ref(node); // Allow the ref forwarding
        }}
        className={`sl:py-4 rounded-lg py-2 xl:px-2 ${isOver ? "bg-blue-100 dark:bg-neutral-950" : ""}`}
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
                {prospectsCount}
              </span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 dark:bg-dark-tertiary dark:text-white"
                onClick={() => setIsModalNewProspectsOpen(true)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="custom-scrollbar h-[65vh] overflow-y-auto">
          {prospects
            .filter((prospect) => prospect.status === status)
            .map((prospect) => (
              <div key={prospect.id} className="relative">
                <Prospect key={prospect.id} prospect={prospect} />
              </div>
            ))}
        </div>
      </div>
    );
  },
);

type ProspectProps = {
  prospect: ProspectsType;
};

const Prospect = ({ prospect }: ProspectProps) => {
  const dragRef = useRef(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "prospect",
    item: { id: prospect.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Attach the drag source to the element ref
  drag(dragRef);

  const formattedInquiryDate = prospect.inquiryDate
    ? format(new Date(prospect.inquiryDate), "MMM d, h:mm a")
    : "";

  const [prospectOptionsVisible, setProspectOptionsVisible] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] =
    useState<ProspectsType | null>(null);

  const [deleteProspect, { isLoading: isDeleting }] =
    useDeleteProspectsMutation();

  const handleEditClick = (prospect: ProspectsType) => {
    setSelectedProspect(prospect);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (prospect: ProspectsType) => {
    if (window.confirm("Are you sure you want to delete this prospect?")) {
      try {
        await deleteProspect(prospect.id).unwrap(); // Ensure `prospect.id` is passed
        toast.success("Prospect deleted successfully!");
      } catch (error) {
        console.error("Failed to delete the prospect:", error);
        toast.error("Failed to delete the prospect!");
      }
    }
  };

  return (
    <div
      ref={dragRef} // Attach the drag ref here
      className={`mb-4 rounded-md p-4 shadow ${isDragging ? "opacity-50" : "opacity-100"} bg-white dark:bg-dark-secondary`}
    >
      <div className="px-2">
        <div className="flex items-center justify-between">
          <div className="my-3 flex justify-between">
            <h4 className="text-md font-bold dark:text-white">
              {prospect.name}
            </h4>
          </div>
          <button
            className="flex h-6 w-4 flex-shrink-0 items-center justify-center dark:text-neutral-500"
            onClick={(e) => {
              e.stopPropagation();
              setProspectOptionsVisible((prev) => !prev);
            }}
          >
            <EllipsisVertical size={26} />
          </button>
          {prospectOptionsVisible && (
            <div className="absolute right-12 z-50 mt-6 rounded bg-white shadow-lg">
              <button
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(prospect);
                }}
              >
                Edit
              </button>
              <button
                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(prospect);
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-neutral-500">
        <div>
        <ChartBarStacked width={16} className="mr-2"/> {" "}
          </div>
        <div>
          {prospect.category}
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-neutral-500">
          <CalendarSearch width={16} className="mr-2"/> {" "}
          {formattedInquiryDate && <span>{formattedInquiryDate}</span>}
        </div>
        {isEditModalOpen && (
          <ModalNewProspects
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            prospect={selectedProspect}
          />
        )}
      </div>
    </div>
  );
};

export default ProspectsBoardView;
