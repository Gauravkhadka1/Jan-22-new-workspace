import React from "react";

const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <div className="text-center p-6 bg-white rounded-lg shadow-lg w-full sm:w-96">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Oops! Access Denied</h1>
        <p className="text-lg mb-6">
          Sorry, you are not authorized to view this page. 
        </p>
        {/* <button
          onClick={() => window.location.href = "/"}
          className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none"
        >
          Go Back to Homepage
        </button> */}
      </div>
    </div>
  );
};

export default Unauthorized;
