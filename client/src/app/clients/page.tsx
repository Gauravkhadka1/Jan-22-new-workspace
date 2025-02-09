"use client"
import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import ClientHeader from '../projects/ClientHeader';

type Client = {
  id: number;
  companyName: string;
  website: string;
};

const clientData: Client[] = [
  { id: 1, companyName: 'Webtech Nepal', website: 'https://webtechnepal.com' },
  { id: 2, companyName: 'Tech Solutions', website: 'https://techsolutions.com' },
  { id: 3, companyName: 'Creative Minds', website: 'https://creativeminds.com' },
];

const ClientPage = () => {
  const [data, setData] = useState(clientData);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const handleSort = () => {
    const sortedData = [...data].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.companyName.localeCompare(b.companyName);
      } else {
        return b.companyName.localeCompare(a.companyName);
      }
    });
    setData(sortedData);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
<ClientHeader/>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-4 text-left">SN</th>
              <th className="py-3 px-4 text-left cursor-pointer flex items-center" onClick={handleSort}>
                Company Name <ArrowUpDown size={16} className="ml-2" />
              </th>
              <th className="py-3 px-4 text-left">Website</th>
            </tr>
          </thead>
          <tbody>
            {data.map((client, index) => (
              <tr key={client.id} className="border-t hover:shadow-md transition-shadow">
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4">{client.companyName}</td>
                <td className="py-3 px-4">
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {client.website}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientPage;
