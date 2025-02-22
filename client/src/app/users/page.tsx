"use client";
import { useGetUsersQuery, useUpdateUserRoleMutation } from "@/state/api";
import React from "react";
import Header from "@/components/Header";
import withAuth from "../../hoc/withAuth";
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; 
 // For notifications
import { toast } from "react-toastify";
const CustomToolbar = () => (
  <GridToolbarContainer className="toolbar flex gap-2">
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const Users = () => {
  const { data: users, isLoading, isError } = useGetUsersQuery();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [updateUserRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();

  // Define columns conditionally
  const columns: GridColDef[] = [
    { field: "userId", headerName: "ID", width: 100 },
    {
      field: "username",
      headerName: "Username",
      width: 150,
      renderCell: (params) => (
        <Link href={`/usertasks/${params.row.userId}`} className="text-blue-500 hover:underline">
          {params.value}
        </Link>
      ),
    },
  ];

  if (isAdmin) {
    columns.push({
      field: "role",
      headerName: "Role",
      width: 150,
      renderCell: (params) => {
        const [role, setRole] = React.useState(params.row.role || "INTERN");

        const handleRoleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
          const newRole = event.target.value;
          setRole(newRole);

          try {
            await updateUserRole({ userId: params.row.userId, role: newRole }).unwrap();
            toast.success("User role updated successfully!");
          } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role. Please try again.");
          }
        };

        return (
          <select
            value={role}
            onChange={handleRoleChange}
            className="border rounded px-2 py-1"
            disabled={isUpdating}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="INTERN">INTERN</option>
          </select>
        );
      },
    });
  }

  if (isLoading) return <div>Loading...</div>;
  if (isError || !users) return <div>Error fetching users</div>;

  return (
    <div className="flex w-full flex-col p-8">
      <Header name="Users" />
      <div style={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={users || []}
          columns={columns}
          getRowId={(row) => row.userId}
          pagination
          slots={{ toolbar: CustomToolbar }}
        />
      </div>
    </div>
  );
};

export default withAuth(Users);
