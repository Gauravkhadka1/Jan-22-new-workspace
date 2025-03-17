"use client";

import React, { useState } from "react";
import ProspectsHeader from "../ProspectHeader";

import ModalNewProspects from "@/components/ModalNewandEditProspects";
import { useAuth } from "../../context/AuthContext"; // Import the custom hook
import { useGetProspectsQuery, useUpdateProspectMutation, useCreateProspectsMutation } from "@/state/api";
import { Clock } from "lucide-react";
import DashboardCalendarView from "../DashboardCalendarView";
import withRoleAuth from "../../hoc/withAuth";
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import ProspectsBoardView from "../ProspectsBoardView";
import ProspectHeader from "../ProspectHeader";


type Props = {
  params: { id: string };
};

const Prospects = ({ params }: Props) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewProspectsOpen, setIsModalNewProspectsOpen] = useState(false);
  const { user } = useAuth(); // Assuming the hook returns the logged-in user
  const userId = user?.id; // Adjust this based on how your user data is structured
  
  return (
    <div>
      {/* Add ToastContainer here */}
      <Toaster/>

      {/* Modal for creating/editing tasks */}
      <ModalNewProspects
        isOpen={isModalNewProspectsOpen}
        onClose={() => setIsModalNewProspectsOpen(false)}
      />
      {/* Task header with tabs */}
      <ProspectsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Render the appropriate view based on the active tab */}
      {activeTab === "Calendar" && <DashboardCalendarView />}
      {activeTab === "Board" && (
        <ProspectsBoardView id={id} setIsModalNewProspectsOpen={setIsModalNewProspectsOpen}  />
      )}
    </div>
  );
};

export default Prospects;