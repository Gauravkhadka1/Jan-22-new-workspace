"use client";
import { useGetUsersQuery, useUpdateUserRoleMutation } from "@/state/api";
import React from "react";
import Header from "@/components/Header";
import withRoleAuth from "../../hoc/withRoleAuth";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Import shadcn table components

const restrictedUserIds = ["12", "9", "8", "7"];
const customOrder = ["3", "5", "11", "2", "4", "10", "13", "14", "15", "12", "9", "8", "7"];

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

  if (isLoading) return <div>Loading...</div>;
  if (isError || !filteredUsers) return <div>Error fetching users</div>;

  return (
    <div className="flex w-full flex-col p-8 dark:text-gray-200">
      <Header name="Users" />
      <div className="w-full">
      <Table className="border border-gray-300 dark:border-gray-600"> {/* Increased border radius */}
          <TableHeader className="dark:bg-dark-secondary">
            <TableRow>
              <TableHead className="dark:text-gray-200">S.No.</TableHead>
              <TableHead className="dark:text-gray-200">Username</TableHead>
              {isAdmin && <TableHead className="dark:text-gray-200">Role</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, index) => (
              <TableRow key={user.userId} className="dark:bg-dark-secondary">
                <TableCell className="dark:text-gray-200">{index + 1}</TableCell> {/* Use index + 1 for serial number */}
                <TableCell className="dark:text-gray-200">
                  <Link
                    href={{
                      pathname: `/usertasks/${user.userId}`,
                      query: { username: user.username },
                    }}
                    className="text-blue-500 hover:underline dark:text-gray-200"
                  >
                    {user.username}
                  </Link>
                </TableCell>
                {isAdmin && (
                  <TableCell className="dark:text-gray-200">
                    <select
                      value={user.role}
                      onChange={async (event) => {
                        const newRole = event.target.value;
                        try {
                          // Ensure userId is a number before passing it
                          if (typeof user.userId === "number") {
                            await updateUserRole({ userId: user.userId, role: newRole }).unwrap();
                            toast.success("User role updated successfully!");
                          } else {
                            console.error("Invalid userId:", user.userId);
                            toast.error("Failed to update role. Invalid user ID.");
                          }
                        } catch (error) {
                          console.error("Error updating role:", error);
                          toast.error("Failed to update role. Please try again.");
                        }
                      }}
                      className="border border-gray-300 rounded px-2 py-1 dark:bg-dark-secondary dark:text-gray-200"
                      disabled={isUpdating}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="INTERN">INTERN</option>
                    </select>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default withRoleAuth(Users, ["ADMIN", "MANAGER"]);