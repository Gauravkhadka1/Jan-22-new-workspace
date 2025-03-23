"use client"; // Make this a Client Component

import { usePathname } from "next/navigation";
import DashboardWrapper from "./dashboardWrapper";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define pages where DashboardWrapper should NOT be used
  const noWrapperPages = ["/", "/signup"];
  const isExcludedPage = noWrapperPages.includes(pathname);

  return <>{isExcludedPage ? children : <DashboardWrapper>{children}</DashboardWrapper>}</>;
}
