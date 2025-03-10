import React, { useState } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BarController, LineController } from 'chart.js'; // Import controllers for mixed chart
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Plugin for data labels

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
  ChartDataLabels // Register the datalabels plugin
);

const SalesChart = () => {
  // Initial sales data
  const [salesData, setSalesData] = useState({
    labels: ['Mangshir', 'Poush', 'Magh', 'Falgun'],
    datasets: [
      {
        type: 'bar' as const, // Bar chart for actual sales
        label: 'Total Sales',
        data: [230182, 748010, 420000, 625417],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        type: 'line' as const, // Line chart for target sales
        label: 'Target Sales',
        data: [1000000, 1000000, 1000000, 1000000], // Target for each month
        borderColor: 'rgba(255, 99, 132, 1)', // Red color for target line
        borderWidth: 2,
        fill: false, // Do not fill under the line
        pointRadius: 0, // Hide points on the line
        borderDash: [5, 5], // Dashed line for creative effect
      },
    ],
  });

  // State to manage new month input
  const [newMonth, setNewMonth] = useState({ label: '', sales: 0 });

  // Function to add a new month's sales
  const addNewMonth = () => {
    if (newMonth.label && newMonth.sales > 0) {
      setSalesData((prevData) => ({
        labels: [...prevData.labels, newMonth.label],
        datasets: [
          {
            ...prevData.datasets[0],
            data: [...prevData.datasets[0].data, newMonth.sales],
          },
          {
            ...prevData.datasets[1],
            data: [...prevData.datasets[1].data, 1000000], // Add target for the new month
          },
        ],
      }));
      setNewMonth({ label: '', sales: 0 }); // Reset input fields
    }
  };

  return (
    <div>
      <h2>Monthly Sales Data</h2>
      <Chart
        type="bar" // Base chart type is bar
        data={salesData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Monthly Sales vs Target',
            },
            datalabels: {
              // Configure data labels
              anchor: 'end', // Position the label at the end of the bar
              align: 'top', // Align the label at the top of the bar
              formatter: (value: number, context: any) => {
                const target = salesData.datasets[1].data[context.dataIndex]; // Get target value
                const percentage = ((value / target) * 100).toFixed(2); // Calculate percentage
                return `${value.toLocaleString()} (${percentage}%)`; // Display total sales and percentage
              },
              color: 'black', // Label text color
              font: {
                weight: 'bold', // Make the text bold
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Sales Amount',
              },
            },
          },
        }}
      />

      <div style={{ marginTop: '20px' }}>
        <h3>Add New Month Sales</h3>
        <input
          type="text"
          placeholder="Month Name"
          value={newMonth.label}
          onChange={(e) => setNewMonth({ ...newMonth, label: e.target.value })}
        />
        <input
          type="number"
          placeholder="Total Sales"
          value={newMonth.sales}
          onChange={(e) => setNewMonth({ ...newMonth, sales: +e.target.value })}
        />
        <button onClick={addNewMonth}>Add Month</button>
      </div>
    </div>
  );
};

export default SalesChart;