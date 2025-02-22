"use client";
import { useGetUsersQuery } from "@/state/api";
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
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext"; // Import useAuth


const CustomToolbar = () => (
  <GridToolbarContainer className="toolbar flex gap-2">
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const Users = () => {
  const { data: users, isLoading, isError } = useGetUsersQuery();
  const { user } = useAuth(); // Get logged-in user from AuthContext
  const isAdmin = user?.role === "ADMIN"; // Check if the logged-in user is an admin

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

  // Add the Role column only if the user is an admin
  if (isAdmin) {
    columns.push({
      field: "role",
      headerName: "Role",
      width: 100,
      renderCell: (params) => (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-9 w-9">
            {params.row.role || "N/A"}
          </div>
        </div>
      ),
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
          slots={{
            toolbar: CustomToolbar,
          }}
        />
      </div>
    </div>
  );
};

export default withAuth(Users);
