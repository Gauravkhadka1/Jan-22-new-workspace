"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const withRoleAuth = (WrappedComponent, allowedRoles = []) => {
  return (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push("/"); // Redirect if not logged in
        } else if (!allowedRoles.includes(user.role)) {
          router.push("/unauthorized"); // Redirect if role is not allowed
        }
      }
    }, [user, loading, router]);

    if (loading) return <p>Loading...</p>;

    return user && allowedRoles.includes(user.role) ? (
      <WrappedComponent {...props} />
    ) : null;
  };
};

export default withRoleAuth;
