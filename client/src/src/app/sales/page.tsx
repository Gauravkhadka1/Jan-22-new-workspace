"use client"
import SalesChart from '@/components/SalesChart';
import React from 'react';
import withRoleAuth from "../../hoc/withRoleAuth";

const Sales = () => {
  return (
    <div>
      <h1 className='ml-6 mt-2 font-semibold text-sm dark:text-gray-200'>Sales Data</h1>
      <SalesChart />
    </div>
  );
};

export default withRoleAuth(Sales, ["ADMIN"]);