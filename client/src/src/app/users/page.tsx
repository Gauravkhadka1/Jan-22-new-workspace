"use client";
import { useGetUsersQuery, useUpdateUserRoleMutation } from "@/state/api";
import React from "react";
import Header from "@/components/Header";
import withRoleAuth from "../../hoc/withRoleAuth";
import { useRouter } from 'next/router';
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { grey, blue, red } from "@mui/material/colors";

// Dark theme for DataGrid
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: blue[500],
    },
    background: {
      default: "#1d1f21", // Dark background
      paper: "#1d1f21", // Dark background for paper
    },
    text: {
      primary: grey[100], // Light text for dark mode
      secondary: grey[300],
    },
  },
});

// Light theme for DataGrid
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: blue[500],
    },
    background: {
      default: "#ffffff", // White background
      paper: "#f5f5f5", // Light gray background for paper
    },
    text: {
      primary: grey[900], // Dark text for light mode
      secondary: grey[700],
    },
  },
});

const restrictedUserIds = ["12", "9", "8", "7"];
const customOrder = ["3", "5", "11", "2", "4", "10", "13", "14", "15", "12", "9", "8", "7"];

const CustomToolbar = () => (
  <GridToolbarContainer className="toolbar flex gap-2">
    {/* <GridToolbarFilterButton />
    <GridToolbarExport /> */}
  </GridToolbarContainer>
);

const Users = () => {
  const { data: users, isLoading, isError } = useGetUsersQuery();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  let filteredUsers = users || [];

  const [updateUserRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();

  if (!isAdmin) {
    filteredUsers = filteredUsers.filter((user) => !restrictedUserIds.includes(String(user.userId)));
  }

  // Sort users based on custom order
  filteredUsers = [...filteredUsers].sort((a, b) => {
    const indexA = customOrder.indexOf(String(a.userId) || "");
    const indexB = customOrder.indexOf(String(b.userId) || "");
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Add serial numbers
  filteredUsers = filteredUsers.map((user, index) => ({
    ...user,
    serialNo: index + 1, // Serial number
  }));

  // Define columns conditionally
  const columns: GridColDef[] = [
    {
      field: "serialNo",
      headerName: "S.No.",
      width: 100,
    },
    {
      field: "username",
      headerName: "Username",
      width: 150,
      renderCell: (params) => (
        <Link 
          href={{
            pathname: `/usertasks/${params.row.userId}`,
            query: { username: params.value },
          }} 
          className="text-blue-500 hover:underline dark:text-gray-200 dark:text-hover-blue-500"
        >
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
            className="border rounded px-2 py-1 bg-white dark:bg-dark-tertiary dark:text-gray-200"
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
  if (isError || !filteredUsers) return <div>Error fetching users</div>;

  // Determine the current mode (light or dark)
  const isDarkMode = false; // Replace with your logic to determine the mode

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <div className="flex w-full flex-col p-8 dark:bg-dark-secondary">
        <Header name="Users" />
        <div style={{ height: 650, width: "100%" }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            getRowId={(row) => row.userId}
            pagination
            slots={{ toolbar: CustomToolbar }}
            sx={{
              backgroundColor: isDarkMode ? darkTheme.palette.background.default : lightTheme.palette.background.default,
              color: isDarkMode ? darkTheme.palette.text.primary : lightTheme.palette.text.primary,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: isDarkMode ? darkTheme.palette.background.paper : lightTheme.palette.background.paper,
              },
              "& .MuiDataGrid-cell": {
                borderBottom: `1px solid ${isDarkMode ? darkTheme.palette.divider : lightTheme.palette.divider}`,
              },
              "& .MuiDataGrid-footerContainer": {
                backgroundColor: isDarkMode ? darkTheme.palette.background.paper : lightTheme.palette.background.paper,
              },
            }}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default withRoleAuth(Users, ["ADMIN", "MANAGER"]);