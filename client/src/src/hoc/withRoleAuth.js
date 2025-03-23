"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const withRoleAuth = (WrappedComponent, allowedRoles = [], restrictedIds = []) => {
  return (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const id = props.params?.id; // Extract the ID from props

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push("/"); // Redirect if not logged in
        } else if (!allowedRoles.includes(user.role) || restrictedIds.includes(id)) {
          router.push("/unauthorized"); // Redirect if not an admin or ID is restricted
        }
      }
    }, [user, loading, router, id]);

    if (loading) return <p>Loading...</p>;

    return user && allowedRoles.includes(user.role) && !restrictedIds.includes(id) ? (
      <WrappedComponent {...props} />
    ) : null;
  };
};

export default withRoleAuth;
