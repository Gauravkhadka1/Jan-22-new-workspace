"use client"
import SalesChart from '@/components/SalesChart';
import React from 'react';
import withRoleAuth from "../../hoc/withRoleAuth";

const Sales = () => {
  return (
    <div>
      <h1>Sales Dashboard</h1>
      <SalesChart />
    </div>
  );
};

export default withRoleAuth(Sales, ["ADMIN"]);