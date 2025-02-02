import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; // Import the custom hook

const Dashboard = () => {
  const [tasks, setTasks] = useState([]); // Empty array as initial state
  const { user, loading } = useAuth(); // Get logged-in user and loading state

  // Show loading state or prompt user to log in
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to see your tasks.</div>;
  }

  const userId = user.id; // Use logged-in user's ID

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}tasks?assignedTo=${userId}`
        );
        const data = await res.json();
        setTasks(data); // Set tasks to the state
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    if (userId) {
      fetchTasks(); // Fetch tasks only if user is logged in
    }
  }, [userId]);

  return (
    <div>
      <h2>My Assigned Tasks</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li> // Display task titles
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
